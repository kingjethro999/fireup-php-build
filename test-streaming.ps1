# Test streaming API with proper response handling
$config = '{"name":"AI Code Logic","languages":["php","javascript","tailwind","css"],"api_info":{"key":"fireup/php-build","url":"https://fireup-php-build.onrender.com"}}'

$body = @{
    config_file = $config
    api_key = "fireup/php-build"
    messages = @(
        @{
            role = "user"
            content = "Hello, can you tell me a short joke?"
        }
    )
    stream = $true
} | ConvertTo-Json -Depth 3

Write-Host "Testing API with streaming response..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body $body -UseBasicParsing
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Yellow
    
    # Parse the streaming response
    $content = $response.Content
    $lines = $content -split "`n"
    
    Write-Host "`nParsed Response:" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    
    $fullResponse = ""
    
    foreach ($line in $lines) {
        if ($line.StartsWith("data: ")) {
            $data = $line.Substring(6)
            if ($data -ne "[DONE]") {
                try {
                    $parsed = $data | ConvertFrom-Json
                    if ($parsed.choices[0].delta.content) {
                        $content = $parsed.choices[0].delta.content
                        $fullResponse += $content
                        Write-Host $content -NoNewline
                    }
                } catch {
                    # Ignore parsing errors
                }
            }
        }
    }
    
    Write-Host "`n`nFull Response:" -ForegroundColor Green
    Write-Host $fullResponse
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
} 