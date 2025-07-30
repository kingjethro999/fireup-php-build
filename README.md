# Expose API Proxy Server

A private Node.js proxy server that securely handles API requests to external AI services while keeping your API keys private.

## 🏗️ Architecture

```
Public Framework → Proxy Server → OpenRouter API
     (JSON config)    (Validates key)   (Your API key)
```

## 📁 File Structure

- `server.js` - Main Node.js proxy server
- `package.json` - Dependencies and scripts
- `only.key.ts` - Public key for client authentication
- `expose_ai.key.ts` - Private OpenRouter API key (keep secret!)
- `expose_ai.url.ts` - OpenRouter API endpoint
- `chat.logic.json` - Client configuration file
- `demo_api.call.ts` - Example API call
- `expose-client.ts` - Client utility class
- `frontend-example.html` - Complete frontend demo with thinking preview

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **For development:**
   ```bash
   npm run dev
   ```

## 🔑 Authentication & Configuration

The server requires **both authentication and configuration validation**:

### Required Files:
- **`chat.logic.json`** - **MANDATORY** configuration file that must be included in every request
- **API Key** - Must match the key in your `chat.logic.json`

### Configuration Structure:
```json
{
  "name": "AI Code Logic",
  "languages": ["php", "javascript", "tailwind", "css"],
  "api_info": {
    "key": "fireup/php-build",
    "url": "https://fireup-php-build.onrender.com"
  }
}
```

### Validation:
- **Public Key**: `fireup/php-build` (safe to share)
- **Private Key**: Your OpenRouter API key (kept secret on server)
- **Configuration**: Must include all required fields and valid API key

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Configuration Validation
```
POST /api/validate-config
Headers: 
  - Content-Type: application/json

Body:
{
  "config_file": "{\"name\":\"AI Code Logic\",\"languages\":[\"php\",\"javascript\",\"tailwind\",\"css\"],\"api_info\":{\"key\":\"fireup/php-build\",\"url\":\"https://fireup-php-build.onrender.com\"}}"
}
```

### Chat Completion
```
POST /api/chat
Headers: 
  - x-api-key: fireup/php-build
  - Content-Type: application/json

Body:
{
  "config_file": "{\"name\":\"AI Code Logic\",\"languages\":[\"php\",\"javascript\",\"tailwind\",\"css\"],\"api_info\":{\"key\":\"fireup/php-build\",\"url\":\"https://fireup-php-build.onrender.com\"}}", // REQUIRED: chat.logic.json content
  "model": "deepseek/deepseek-chat-v3-0324:free", // Optional, has default
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ],
  "stream": true // Optional, thinking preview enabled by default
}
```

## 💻 Usage Examples

### Basic Fetch Request
```typescript
// API call with thinking preview (streaming enabled by default)
const config = {
  "name": "AI Code Logic",
  "languages": ["php", "javascript", "tailwind", "css"],
  "api_info": {
    "key": "fireup/php-build",
    "url": "https://fireup-php-build.onrender.com"
  }
};

fetch("https://fireup-php-build.onrender.com/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "fireup/php-build"
  },
  body: JSON.stringify({
    config_file: JSON.stringify(config), // REQUIRED: Include chat.logic.json
    messages: [
      {
        role: "user",
        content: "What is the meaning of life?"
      }
    ]
    // stream: true is now the default - no need to specify
  })
});
```

### Using ExposeClient
```typescript
import { ExposeClient } from './expose-client';

const client = new ExposeClient();

// Chat with thinking preview (streaming enabled by default)
const response = await client.chat([
  { role: "user", content: "What is the meaning of life?" }
]);

// Alternative: Use chatStream for callback-based streaming
let fullResponse = '';
await client.chatStream([
  { role: "user", content: "What is the meaning of life?" }
], (chunk) => {
  fullResponse += chunk;
  console.log('AI thinking:', chunk);
  // Update your UI here with the streaming content
});
```

## 🔒 Security Features

1. **API Key Validation**: All requests must include the correct public key
2. **Private Key Protection**: Your OpenRouter API key stays on the server
3. **Request Logging**: Server logs all requests for monitoring
4. **Error Handling**: Proper error responses without exposing sensitive data

## 🧠 Thinking Preview Feature

The server **always streams responses** to show AI thinking and reasoning in real-time:

- **`stream: true`** (default): Always streams response for thinking preview
- **No loading spinners**: Users see AI reasoning as it happens
- **Better UX**: Eliminates perception of "slow" responses
- **Frontend Integration**: See `frontend-example.html` for complete implementation

## 🌐 Deployment

### Render.com (Recommended)
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables if needed

### Other Platforms
The server works on any Node.js hosting platform:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform

## 📊 Monitoring

The server includes:
- Request logging with timestamps
- Error tracking
- Health check endpoint
- Response metadata

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)

### Customization
- Modify `server.js` to add more endpoints
- Update authentication logic in `authenticateRequest` middleware
- Add rate limiting or additional security measures

## 🚨 Important Notes

1. **Never commit your private API keys** to version control
2. **Keep `expose_ai.key.ts` secure** - it contains your real OpenRouter API key
3. **The public key in `only.key.ts`** is safe to share with users
4. **`chat.logic.json` is MANDATORY** - every request must include this configuration file
5. **Update the URL** in `chat.logic.json` when you deploy to your server

## 🐛 Troubleshooting

### Common Issues

1. **400 Configuration Required**: Include `chat.logic.json` in your request as `config_file`
2. **400 Invalid Configuration**: Ensure your `chat.logic.json` has all required fields
3. **401 Unauthorized**: Check that the `x-api-key` header matches `only.key.ts`
4. **403 Forbidden**: Verify the API key in your configuration matches the required key
5. **500 Internal Error**: Check server logs for OpenRouter API issues
6. **CORS Errors**: The server includes CORS middleware, but check your client setup

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment variables. 