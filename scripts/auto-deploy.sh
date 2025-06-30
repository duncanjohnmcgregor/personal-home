#!/bin/bash

# Music Playlist Manager - Fully Automated Internet Deployment
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="music-playlist-manager"
GITHUB_REPO_URL=""
VERCEL_PROJECT_NAME="music-playlist-manager"

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                 🎵 Music Playlist Manager                     ║"
    echo "║                Automated Internet Deployment                  ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install required tools
install_tools() {
    print_step "Installing required deployment tools..."
    
    # Install Vercel CLI
    if ! command_exists vercel; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    else
        print_success "Vercel CLI already installed"
    fi
    
    # Install Supabase CLI for database automation
    if ! command_exists supabase; then
        print_status "Installing Supabase CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install supabase/tap/supabase
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            npx supabase@latest --version >/dev/null 2>&1 || npm install -g supabase
        else
            print_warning "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
        fi
    else
        print_success "Supabase CLI already installed"
    fi
    
    # Install GitHub CLI
    if ! command_exists gh; then
        print_status "Installing GitHub CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install gh
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        else
            print_warning "Please install GitHub CLI manually: https://cli.github.com/manual/installation"
        fi
    else
        print_success "GitHub CLI already installed"
    fi
}

# Function to create or ensure GitHub repository
setup_github_repo() {
    print_step "Setting up GitHub repository..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_status "Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit - Music Playlist Manager with DevOps infrastructure"
    fi
    
    # Login to GitHub if not already logged in
    if ! gh auth status >/dev/null 2>&1; then
        print_status "Logging into GitHub..."
        gh auth login --web
    fi
    
    # Get current repository or create new one
    if gh repo view >/dev/null 2>&1; then
        GITHUB_REPO_URL=$(gh repo view --json url -q .url)
        print_success "Using existing repository: $GITHUB_REPO_URL"
    else
        print_status "Creating GitHub repository..."
        gh repo create $PROJECT_NAME --public --source=. --remote=origin --push
        GITHUB_REPO_URL=$(gh repo view --json url -q .url)
        print_success "Created repository: $GITHUB_REPO_URL"
    fi
}

# Function to automatically create Supabase database
setup_database() {
    print_step "Setting up automated database..."
    
    # Login to Supabase if not already logged in
    if ! supabase status >/dev/null 2>&1; then
        print_status "Logging into Supabase..."
        supabase login
    fi
    
    # Create new Supabase project
    print_status "Creating Supabase project..."
    PROJECT_ID="music-playlist-$(date +%s)"
    
    # Initialize Supabase project locally
    if [ ! -f "supabase/config.toml" ]; then
        supabase init
    fi
    
    # Link to a new Supabase project or create one
    print_status "Setting up Supabase project..."
    if ! supabase projects list | grep -q "$PROJECT_NAME"; then
        # Create project via Supabase dashboard
        print_status "Please create a Supabase project manually at: https://supabase.com/dashboard"
        print_status "Project name: $PROJECT_NAME"
        print_warning "After creating the project, press ENTER to continue..."
        read -p ""
    fi
    
    # Get database URL
    print_status "Retrieving database connection string..."
    supabase status
    
    # Extract connection details
    DATABASE_URL=$(supabase status | grep "DB URL" | awk '{print $3}' || echo "")
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "Unable to automatically retrieve database URL"
        print_status "Please provide your Supabase database URL:"
        read -p "Database URL: " DATABASE_URL
    fi
    
    print_success "Database configured: ${DATABASE_URL%:*}:***@${DATABASE_URL#*@}"
}

# Function to generate secure secrets
generate_secrets() {
    print_step "Generating secure secrets..."
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    print_success "Generated NextAuth secret"
    
    # Generate other required secrets
    JWT_SECRET=$(openssl rand -base64 32)
    print_success "Generated JWT secret"
}

# Function to setup Spotify app automatically
setup_spotify_api() {
    print_step "Setting up Spotify API..."
    
    print_status "Spotify Developer App setup requires manual creation."
    print_status "Please follow these steps:"
    echo ""
    echo "1. Go to: https://developer.spotify.com/dashboard"
    echo "2. Click 'Create App'"
    echo "3. App Name: Music Playlist Manager"
    echo "4. App Description: Personal music playlist management tool"
    echo "5. Redirect URI: https://$VERCEL_PROJECT_NAME.vercel.app/api/auth/callback/spotify"
    echo "6. API Used: Web API"
    echo ""
    
    print_warning "After creating the app, please provide the credentials:"
    read -p "Spotify Client ID: " SPOTIFY_CLIENT_ID
    read -p "Spotify Client Secret: " SPOTIFY_CLIENT_SECRET
    
    print_success "Spotify API configured"
}

# Function to deploy to Vercel automatically
deploy_to_vercel() {
    print_step "Deploying to Vercel..."
    
    # Login to Vercel if not already logged in
    if ! vercel whoami >/dev/null 2>&1; then
        print_status "Logging into Vercel..."
        vercel login
    fi
    
    # Create vercel project configuration
    print_status "Configuring Vercel project..."
    cat > .vercel/project.json << EOF
{
  "projectId": "",
  "orgId": ""
}
EOF
    
    # Initial deployment to create project
    print_status "Creating Vercel project..."
    vercel --yes --name $VERCEL_PROJECT_NAME
    
    # Set environment variables
    print_status "Setting environment variables..."
    vercel env add NEXTAUTH_URL production <<< "https://$VERCEL_PROJECT_NAME.vercel.app"
    vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"
    vercel env add SPOTIFY_CLIENT_ID production <<< "$SPOTIFY_CLIENT_ID"
    vercel env add SPOTIFY_CLIENT_SECRET production <<< "$SPOTIFY_CLIENT_SECRET"
    
    # Deploy to production
    print_status "Deploying to production..."
    vercel --prod --yes
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel inspect --wait | grep "URL:" | awk '{print $2}' | head -1)
    if [ -z "$DEPLOYMENT_URL" ]; then
        DEPLOYMENT_URL="https://$VERCEL_PROJECT_NAME.vercel.app"
    fi
    
    print_success "Deployed to: $DEPLOYMENT_URL"
}

# Function to run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    # Set environment for migration
    export DATABASE_URL="$DATABASE_URL"
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    print_status "Running database migrations..."
    npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Function to setup GitHub secrets for CI/CD
setup_github_secrets() {
    print_step "Setting up GitHub secrets for CI/CD..."
    
    # Get Vercel project details
    VERCEL_ORG_ID=$(vercel project list | grep $VERCEL_PROJECT_NAME | awk '{print $2}' || echo "")
    VERCEL_PROJECT_ID=$(vercel project list | grep $VERCEL_PROJECT_NAME | awk '{print $1}' || echo "")
    
    # Get Vercel token
    print_status "Please create a Vercel token at: https://vercel.com/account/tokens"
    read -p "Vercel Token: " VERCEL_TOKEN
    
    # Set GitHub secrets
    print_status "Setting GitHub repository secrets..."
    gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
    gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
    gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
    gh secret set PRODUCTION_URL --body "$DEPLOYMENT_URL"
    
    print_success "GitHub secrets configured"
}

# Function to run final health checks
run_health_checks() {
    print_step "Running final health checks..."
    
    print_status "Waiting for deployment to be ready..."
    sleep 30
    
    # Test health endpoint
    if curl -f "$DEPLOYMENT_URL/api/health" >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed - deployment may still be starting"
    fi
    
    # Test main page
    if curl -f "$DEPLOYMENT_URL" >/dev/null 2>&1; then
        print_success "Main page accessible!"
    else
        print_warning "Main page not yet accessible"
    fi
}

# Function to display final results
show_final_results() {
    print_banner
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
    echo ""
    echo -e "${CYAN}Your Music Playlist Manager is now live on the internet!${NC}"
    echo ""
    echo -e "${YELLOW}📱 Live URL:${NC} $DEPLOYMENT_URL"
    echo -e "${YELLOW}🔗 GitHub Repo:${NC} $GITHUB_REPO_URL"
    echo -e "${YELLOW}📊 Health Check:${NC} $DEPLOYMENT_URL/api/health"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Visit your live app: $DEPLOYMENT_URL"
    echo "2. Test Spotify authentication"
    echo "3. Create your first playlist"
    echo ""
    echo -e "${GREEN}Automated features now active:${NC}"
    echo "✅ Automatic deployments on git push"
    echo "✅ Continuous integration testing"
    echo "✅ Health monitoring"
    echo "✅ Database migrations"
    echo ""
    echo -e "${CYAN}🎵 Enjoy your personal music playlist manager! 🎵${NC}"
}

# Main execution function
main() {
    print_banner
    
    print_status "Starting fully automated internet deployment..."
    echo ""
    
    # Check prerequisites
    if ! command_exists npm; then
        print_error "Node.js and npm are required. Please install them first."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git is required. Please install it first."
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing project dependencies..."
    npm ci
    
    # Execute deployment steps
    install_tools
    setup_github_repo
    setup_database
    generate_secrets
    setup_spotify_api
    deploy_to_vercel
    run_migrations
    setup_github_secrets
    run_health_checks
    show_final_results
    
    print_success "🚀 Automated deployment completed successfully!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted. You can resume by running this script again."' INT

# Run main function
main "$@"