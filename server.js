import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { expose_ai_key } from './expose_ai.key.js';
import { expose_ai_url } from './expose_ai.url.js';
import { only_key } from './only.key.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration validation middleware
const validateConfig = (req, res, next) => {
  try {
    // Check if chat.logic.json exists in the request
    const configFile = req.files?.['chat.logic.json'] || req.body.config_file;
    
    if (!configFile) {
      return res.status(400).json({
        error: 'Configuration file required',
        message: 'chat.logic.json file is required. Please include it in your request.',
        required_fields: ['name', 'languages', 'api_info.key', 'api_info.url']
      });
    }
    
    let config;
    
    // Handle file upload or JSON string
    if (typeof configFile === 'string') {
      config = JSON.parse(configFile);
    } else if (configFile.data) {
      config = JSON.parse(configFile.data.toString());
    } else {
      config = configFile;
    }
    
    // Validate required fields
    const requiredFields = ['name', 'languages', 'api_info'];
    const requiredApiInfo = ['key', 'url'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: `Missing required field: ${field}`,
          required_fields: requiredFields
        });
      }
    }
    
    for (const field of requiredApiInfo) {
      if (!config.api_info[field]) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: `Missing required api_info field: ${field}`,
          required_fields: requiredApiInfo
        });
      }
    }
    
    // Validate API key matches
    if (config.api_info.key !== only_key) {
      return res.status(403).json({
        error: 'Invalid API key in configuration',
        message: 'The API key in chat.logic.json does not match the required key'
      });
    }
    
    // Store validated config in request for later use
    req.validatedConfig = config;
    
    next();
  } catch (error) {
    console.error('Config validation error:', error);
    return res.status(400).json({
      error: 'Invalid configuration file',
      message: 'chat.logic.json must be valid JSON with required fields',
      required_structure: {
        name: "string",
        languages: ["array of strings"],
        api_info: {
          key: "fireup/php-build",
          url: "https://connectapi-y7ad.onrender.com"
        }
      }
    });
  }
};

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.body.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide an API key in headers (x-api-key) or request body (api_key)'
    });
  }
  
  if (apiKey !== only_key) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Expose API Proxy is running',
    timestamp: new Date().toISOString()
  });
});

// Configuration validation endpoint
app.post('/api/validate-config', (req, res) => {
  try {
    const configFile = req.files?.['chat.logic.json'] || req.body.config_file;
    
    if (!configFile) {
      return res.status(400).json({
        error: 'Configuration file required',
        message: 'Please provide chat.logic.json file for validation',
        required_structure: {
          name: "string",
          languages: ["array of strings"],
          api_info: {
            key: "fireup/php-build",
            url: "https://connectapi-y7ad.onrender.com"
          }
        }
      });
    }
    
    let config;
    
    // Handle file upload or JSON string
    if (typeof configFile === 'string') {
      config = JSON.parse(configFile);
    } else if (configFile.data) {
      config = JSON.parse(configFile.data.toString());
    } else {
      config = configFile;
    }
    
    // Validate required fields
    const requiredFields = ['name', 'languages', 'api_info'];
    const requiredApiInfo = ['key', 'url'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: `Missing required field: ${field}`,
          required_fields: requiredFields
        });
      }
    }
    
    for (const field of requiredApiInfo) {
      if (!config.api_info[field]) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: `Missing required api_info field: ${field}`,
          required_fields: requiredApiInfo
        });
      }
    }
    
    // Validate API key matches
    if (config.api_info.key !== only_key) {
      return res.status(403).json({
        error: 'Invalid API key in configuration',
        message: 'The API key in chat.logic.json does not match the required key'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuration file is valid',
      config: {
        name: config.name,
        languages: config.languages,
        api_info: {
          key: config.api_info.key,
          url: config.api_info.url
        }
      }
    });
    
  } catch (error) {
    console.error('Config validation error:', error);
    return res.status(400).json({
      error: 'Invalid configuration file',
      message: 'chat.logic.json must be valid JSON with required fields',
      required_structure: {
        name: "string",
        languages: ["array of strings"],
        api_info: {
          key: "fireup/php-build",
          url: "https://connectapi-y7ad.onrender.com"
        }
      }
    });
  }
});

// Main API proxy endpoint
app.post('/api/chat', validateConfig, authenticateRequest, async (req, res) => {
  try {
    const { messages, model = "deepseek/deepseek-chat-v3-0324:free", stream = true } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Messages array is required'
      });
    }
    
    // Prepare the request to OpenRouter
    const openRouterRequest = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expose_ai_key}`,
        'HTTP-Referer': 'https://www.google.com',
        'X-Title': 'Google',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: stream // Enable streaming if requested
      })
    };
    
    console.log('Proxying request to OpenRouter:', {
      model,
      messageCount: messages.length,
      stream,
      timestamp: new Date().toISOString()
    });
    
    // Make request to OpenRouter
    const response = await fetch(expose_ai_url, openRouterRequest);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({
        error: 'External API error',
        message: errorData.error?.message || 'Failed to get response from AI service',
        details: errorData
      });
    }
    
    // Handle streaming response
    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      // Pipe the stream directly to client
      response.body.pipe(res);
      
      // Handle connection close
      req.on('close', () => {
        response.body.destroy();
      });
    } else {
      // Handle regular JSON response
      const data = await response.json();
      
      // Return the response from OpenRouter
      res.json({
        success: true,
        data,
        proxy_info: {
          timestamp: new Date().toISOString(),
          model_used: model
        }
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request',
      details: error.message
    });
  }
});

// Alternative endpoint for compatibility
app.post('/api/completions', validateConfig, authenticateRequest, async (req, res) => {
  // Redirect to the main chat endpoint
  req.url = '/api/chat';
  return app._router.handle(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Expose API Proxy server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 API endpoint: http://localhost:${PORT}/api/chat`);
}); 