#!/bin/bash
# RevSync Backend Setup Script
# Sets up the complete backend with Docker and testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..." "INFO"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_status "$service_name is ready!" "SUCCESS"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..." "INFO"
        sleep 2
        ((attempt++))
    done
    
    print_status "$service_name failed to start within expected time" "ERROR"
    return 1
}

print_status "🚀 RevSync Backend Setup" "INFO"
print_status "=========================" "INFO"

# Check prerequisites
print_status "📋 Checking prerequisites..." "INFO"

if ! command_exists docker; then
    print_status "Docker is not installed. Please install Docker first." "ERROR"
    exit 1
fi

if ! command_exists docker-compose; then
    print_status "Docker Compose is not installed. Please install Docker Compose first." "ERROR"
    exit 1
fi

print_status "✅ Docker and Docker Compose are installed" "SUCCESS"

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_status "docker-compose.yml not found in project root" "ERROR"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "📝 Creating .env file..." "INFO"
    cat > .env << EOF
# RevSync Backend Environment Configuration
SECRET_KEY=django-insecure-development-key-change-in-production
DEBUG=True
USE_POSTGRES=True

# Database
DB_NAME=revsync
DB_USER=revsync
DB_PASSWORD=password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# AI Configuration (100% FREE Local)
OLLAMA_HOST=http://localhost:11434
MISTRAL_MODEL=mistral:7b
USE_LOCAL_LLM=True

# Payment (Optional for development)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
EOF
    print_status "✅ Created .env file with FREE AI configuration" "SUCCESS"
    print_status "🤖 AI will run 100% FREE locally with Mistral 7B!" "SUCCESS"
else
    print_status "✅ .env file already exists" "SUCCESS"
fi

# Stop any existing containers
print_status "🛑 Stopping existing containers..." "INFO"
docker-compose down --remove-orphans >/dev/null 2>&1 || true

# Build and start services
print_status "🔨 Building and starting services..." "INFO"
docker-compose up -d --build

# Wait for services to be ready
print_status "⏳ Waiting for services to start..." "INFO"

wait_for_service localhost 5432 "PostgreSQL"
wait_for_service localhost 6379 "Redis"
wait_for_service localhost 11434 "Ollama (FREE AI)"
wait_for_service localhost 8000 "Django Backend"

# Setup FREE Mistral 7B AI
print_status "🤖 Setting up FREE Mistral 7B AI..." "INFO"
./scripts/setup_ollama.sh

# Run migrations
print_status "📊 Running database migrations..." "INFO"
docker-compose exec -T backend python manage.py makemigrations
docker-compose exec -T backend python manage.py migrate

# Create superuser if needed
print_status "👤 Setting up admin user..." "INFO"
docker-compose exec -T backend python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@revsync.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Populate comprehensive motorcycle database
print_status "🏍️  Populating comprehensive motorcycle database..." "INFO"
print_status "This ensures users can find their specific bikes!" "INFO"
docker-compose exec -T backend python manage.py populate_comprehensive_bikes

# Populate initial sample data if needed
print_status "📊 Populating sample tune data..." "INFO"
if docker-compose exec -T backend python manage.py shell -c "from bikes.models import Motorcycle; print(Motorcycle.objects.count())" | grep -q "0"; then
    docker-compose exec -T backend python populate_database.py
    print_status "✅ Sample data populated" "SUCCESS"
else
    print_status "✅ Database already populated" "SUCCESS"
fi

# Run authentication tests
print_status "🧪 Running authentication tests..." "INFO"
if [ -f "backend/test_auth_system.py" ]; then
    cd backend
    python test_auth_system.py
    cd ..
else
    print_status "Test script not found, skipping tests" "WARNING"
fi

# Show service status
print_status "📊 Service Status:" "INFO"
print_status "==================" "INFO"
docker-compose ps

print_status "" "INFO"
print_status "🎉 RevSync Backend Setup Complete!" "SUCCESS"
print_status "====================================" "SUCCESS"
print_status "" "INFO"
print_status "🔗 Service URLs:" "INFO"
print_status "  📱 Django API:     http://localhost:8000" "INFO"
print_status "  🗄️ Django Admin:   http://localhost:8000/admin" "INFO"
print_status "  🤖 Ollama AI:      http://localhost:11434 (FREE!)" "INFO"
print_status "  🐘 PgAdmin:        http://localhost:5050" "INFO"
print_status "  📦 MinIO Console:  http://localhost:9001" "INFO"
print_status "" "INFO"
print_status "🔐 Default Credentials:" "INFO"
print_status "  Django Admin:   admin / admin123" "INFO"
print_status "  PgAdmin:        admin@revsync.com / admin" "INFO"
print_status "  MinIO:          minioadmin / minioadmin123" "INFO"
print_status "" "INFO"
print_status "🧪 Testing:" "INFO"
print_status "  Run: cd backend && python test_auth_system.py" "INFO"
print_status "" "INFO"
print_status "📝 Next Steps:" "INFO"
print_status "  1. ✅ AI is 100% FREE and ready!" "INFO"
print_status "  2. ✅ 500+ motorcycles loaded - users can find their bikes!" "INFO"
print_status "  3. Test the mobile app connection" "INFO"
print_status "  4. Upload some test tunes via Django admin" "INFO"
print_status "  5. 🤖 AI safety analysis works offline!" "INFO"
print_status "" "INFO"
print_status "🛑 To stop: docker-compose down" "INFO"
print_status "📋 To view logs: docker-compose logs -f [service]" "INFO" 