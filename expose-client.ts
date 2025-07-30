// Expose Client - Reads JSON config and makes authenticated requests
export class ExposeClient {
  private config: any;
  private apiKey: string;
  private baseUrl: string;

  constructor(configPath: string = './chat.logic.json') {
    this.loadConfig(configPath);
  }

  private loadConfig(configPath: string) {
    try {
      // In a real implementation, you'd read this from the file system
      // For now, we'll use the known structure
      this.config = {
        name: "AI Code Logic",
        languages: ["php", "javascript", "tailwind", "css"],
        api_info: {
          key: "fireup/php-build",
          url: "https://fireup-php-build.onrender.com"
        }
      };
      
      this.apiKey = this.config.api_info.key;
      this.baseUrl = this.config.api_info.url;
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  async chat(messages: Array<{role: string, content: string}>, model?: string, stream: boolean = true) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        body: JSON.stringify({
          config_file: JSON.stringify(this.config), // Required: Include chat.logic.json
          model: model || "deepseek/deepseek-chat-v3-0324:free",
          messages,
          stream: stream
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }

      if (stream) {
        return response; // Return the stream for client to handle
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('ExposeClient error:', error);
      throw error;
    }
  }

  // Helper method for streaming with callback
  async chatStream(
    messages: Array<{role: string, content: string}>, 
    onChunk: (content: string) => void,
    model?: string
  ) {
    try {
      const response = await this.chat(messages, model, true);
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  onChunk(parsed.choices[0].delta.content);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  getConfig() {
    return this.config;
  }
}

// Usage examples:
// const client = new ExposeClient();

// Chat with thinking preview (streaming enabled by default)
// const response = await client.chat([
//   { role: "user", content: "What is the meaning of life?" }
// ]);

// Alternative: Use chatStream for callback-based streaming
// let fullResponse = '';
// await client.chatStream([
//   { role: "user", content: "What is the meaning of life?" }
// ], (chunk) => {
//   fullResponse += chunk;
//   console.log('AI thinking:', chunk);
//   // Update your UI here with the streaming content
// }); 