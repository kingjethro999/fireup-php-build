// API call with thinking preview (streaming enabled by default)
// First, include your chat.logic.json configuration
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
      "config_file": JSON.stringify(config), // Required: Include chat.logic.json
      "messages": [
        {
          "role": "user",
          "content": "What is the meaning of life?"
        }
      ],
      "stream": true // Thinking preview enabled by default
    })
  }).then(response => {
    if (!response.body) {
      throw new Error('Response body is null');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    function readStream(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) return;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  // Show thinking/reasoning in real-time
                  console.log('AI thinking:', parsed.choices[0].delta.content);
                  // Update your UI here with the streaming content
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        });
        
        return readStream();
      });
    }
    
    return readStream();
  });