#!/bin/bash
# RevSync Ollama Setup Script
# Downloads and configures FREE Mistral 7B model locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    case $2 in
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $1"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $1"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $1"
            ;;
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $1"
            ;;
        *)
            echo -e "${BLUE}[INFO]${NC} $1"
            ;;
    esac
}

print_status "🤖 Setting up FREE Mistral 7B with Ollama" "INFO"
print_status "==========================================" "INFO"

# Wait for Ollama service to be ready
wait_for_ollama() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for Ollama service to be ready..." "INFO"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            print_status "Ollama service is ready!" "SUCCESS"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: Ollama not ready yet..." "INFO"
        sleep 2
        ((attempt++))
    done
    
    print_status "Ollama service failed to start" "ERROR"
    return 1
}

# Check if running in Docker
if [ -f /.dockerenv ]; then
    OLLAMA_HOST="http://ollama:11434"
    print_status "Running inside Docker container" "INFO"
else
    OLLAMA_HOST="http://localhost:11434"
    print_status "Running on host machine" "INFO"
fi

# Wait for Ollama to be ready
if ! wait_for_ollama; then
    print_status "Cannot proceed without Ollama service" "ERROR"
    exit 1
fi

# Check available models
print_status "📋 Checking available models..." "INFO"
available_models=$(curl -s $OLLAMA_HOST/api/tags | grep -o '"name":"[^"]*' | cut -d'"' -f4 || true)

if echo "$available_models" | grep -q "mistral:7b"; then
    print_status "✅ Mistral 7B already available!" "SUCCESS"
else
    print_status "📥 Downloading FREE Mistral 7B model..." "INFO"
    print_status "⚠️ This may take 10-15 minutes on first run (4.1GB download)" "WARNING"
    
    # Pull Mistral 7B model
    if curl -X POST $OLLAMA_HOST/api/pull \
        -H "Content-Type: application/json" \
        -d '{"name": "mistral:7b"}' \
        --max-time 1800; then  # 30 minute timeout
        print_status "✅ Mistral 7B downloaded successfully!" "SUCCESS"
    else
        print_status "❌ Failed to download Mistral 7B" "ERROR"
        print_status "💡 You can try manually: docker exec ollama ollama pull mistral:7b" "INFO"
        exit 1
    fi
fi

# Test the model
print_status "🧪 Testing Mistral 7B model..." "INFO"
test_response=$(curl -s -X POST $OLLAMA_HOST/api/generate \
    -H "Content-Type: application/json" \
    -d '{
        "model": "mistral:7b",
        "prompt": "Hello, respond with just: AI system ready",
        "stream": false,
        "options": {"num_predict": 10}
    }' | grep -o '"response":"[^"]*' | cut -d'"' -f4 || true)

if [ -n "$test_response" ]; then
    print_status "✅ Mistral 7B is working! Response: $test_response" "SUCCESS"
else
    print_status "⚠️ Mistral 7B may not be responding correctly" "WARNING"
fi

# Show model info
print_status "📊 Model Information:" "INFO"
curl -s $OLLAMA_HOST/api/tags | grep -A 10 -B 10 "mistral:7b" || true

print_status "" "INFO"
print_status "🎉 FREE Mistral 7B Setup Complete!" "SUCCESS"
print_status "====================================" "SUCCESS"
print_status "" "INFO"
print_status "🔗 Model Details:" "INFO"
print_status "  Model: Mistral 7B (Open Source)" "INFO"
print_status "  Size: ~4.1GB" "INFO"
print_status "  API: $OLLAMA_HOST" "INFO"
print_status "  Cost: $0.00 (100% FREE!)" "INFO"
print_status "" "INFO"
print_status "🚀 Next Steps:" "INFO"
print_status "  1. Your Django backend will now use FREE local AI" "INFO"
print_status "  2. Safety analysis: 100% free with Mistral 7B" "INFO"
print_status "  3. Recommendations: 100% free with embeddings" "INFO"
print_status "  4. No API costs, no rate limits!" "INFO"
print_status "" "INFO"
print_status "💡 Performance Tips:" "INFO"
print_status "  - Responses may take 2-10 seconds (vs 1s for API)" "INFO"
print_status "  - Use GPU for faster inference if available" "INFO"
print_status "  - Model stays loaded in memory after first use" "INFO"
print_status "" "INFO"
print_status "🎯 RevSync AI is now 100% FREE and LOCAL! 🤖✨" "SUCCESS" 