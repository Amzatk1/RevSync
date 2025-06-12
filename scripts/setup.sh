#!/bin/bash

# RevSync Setup Script
# Sets up the complete development environment

echo "🏍️  Setting up RevSync - Motorcycle Tuning Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    print_status "Node.js $(node --version) ✓"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ and try again."
        exit 1
    fi
    print_status "Python $(python3 --version) ✓"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip and try again."
        exit 1
    fi
    print_status "pip3 ✓"
    
    # Check PostgreSQL (optional but recommended)
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL $(psql --version | awk '{print $3}') ✓"
    else
        print_warning "PostgreSQL not found. You'll need to install it for production use."
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_status "Docker $(docker --version | awk '{print $3}' | sed 's/,//') ✓"
    else
        print_warning "Docker not found. You can still run the project without Docker."
    fi
}

# Setup environment files
setup_environment() {
    print_section "Setting Up Environment"
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_status "Created .env file from template"
        print_warning "Please update .env with your configuration values"
    else
        print_status ".env file already exists"
    fi
    
    if [ ! -f "backend/.env" ]; then
        cp env.example backend/.env
        print_status "Created backend/.env file"
    else
        print_status "backend/.env file already exists"
    fi
}

# Setup Python virtual environment and install backend dependencies
setup_backend() {
    print_section "Setting Up Backend (Django)"
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p media
    mkdir -p staticfiles
    
    print_status "Backend setup complete!"
    cd ..
}

# Setup mobile app dependencies
setup_mobile() {
    print_section "Setting Up Mobile App (React Native)"
    
    cd mobile
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Setup iOS dependencies (if on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v pod &> /dev/null; then
            print_status "Installing iOS dependencies..."
            cd ios && pod install && cd ..
        else
            print_warning "CocoaPods not found. iOS dependencies not installed."
            print_warning "Install CocoaPods: sudo gem install cocoapods"
        fi
    fi
    
    print_status "Mobile app setup complete!"
    cd ..
}

# Setup shared package
setup_shared() {
    print_section "Setting Up Shared Package"
    
    cd shared
    
    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        npm init -y
        print_status "Created shared package.json"
    fi
    
    # Install TypeScript if not already installed
    if [ ! -f "node_modules/.bin/tsc" ]; then
        npm install --save-dev typescript @types/node
        print_status "Installed TypeScript dependencies"
    fi
    
    cd ..
}

# Create necessary directories
create_directories() {
    print_section "Creating Project Directories"
    
    # Documentation directories
    mkdir -p docs/api
    mkdir -p docs/hardware
    mkdir -p docs/deployment
    
    # Hardware directory structure
    mkdir -p hardware/esp32
    mkdir -p hardware/obd2
    mkdir -p hardware/protocols
    
    # Docker directory
    mkdir -p docker
    
    # Mobile app directories
    mkdir -p mobile/src/components
    mkdir -p mobile/src/screens
    mkdir -p mobile/src/services
    mkdir -p mobile/src/store
    mkdir -p mobile/src/utils
    mkdir -p mobile/src/types
    mkdir -p mobile/assets/images
    mkdir -p mobile/assets/icons
    
    # Backend app directories
    mkdir -p backend/accounts
    mkdir -p backend/motorcycles
    mkdir -p backend/tunes
    mkdir -p backend/hardware
    mkdir -p backend/community
    mkdir -p backend/static
    mkdir -p backend/templates
    
    print_status "Created project directory structure"
}

# Generate security keys
generate_keys() {
    print_section "Generating Security Keys"
    
    # Generate Django secret key
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
        print_status "Generated Django secret key"
        
        # Update .env files with generated key
        if [ -f ".env" ]; then
            sed -i.bak "s/SECRET_KEY=your-secret-key-here/SECRET_KEY=$SECRET_KEY/" .env
            rm .env.bak 2>/dev/null || true
        fi
        if [ -f "backend/.env" ]; then
            sed -i.bak "s/SECRET_KEY=your-secret-key-here/SECRET_KEY=$SECRET_KEY/" backend/.env
            rm backend/.env.bak 2>/dev/null || true
        fi
    fi
}

# Initialize database
initialize_database() {
    print_section "Database Setup"
    
    print_warning "Database initialization will be handled separately."
    print_status "To initialize the database later, run:"
    print_status "  cd backend && source venv/bin/activate"
    print_status "  python manage.py makemigrations"
    print_status "  python manage.py migrate"
    print_status "  python manage.py createsuperuser"
}

# Main setup function
main() {
    print_status "Starting RevSync setup process..."
    
    check_prerequisites
    setup_environment
    create_directories
    generate_keys
    setup_shared
    setup_backend
    setup_mobile
    initialize_database
    
    print_section "Setup Complete! 🎉"
    print_status "RevSync has been set up successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Update .env files with your configuration"
    echo "  2. Set up PostgreSQL database"
    echo "  3. Run database migrations: cd backend && python manage.py migrate"
    echo "  4. Create superuser: cd backend && python manage.py createsuperuser"
    echo "  5. Start development servers:"
    echo "     - Backend: npm run start:backend"
    echo "     - Mobile: npm run start:mobile"
    echo ""
    print_status "For detailed instructions, see README.md"
    print_status "Happy coding! 🏍️"
}

# Run main function
main "$@" 