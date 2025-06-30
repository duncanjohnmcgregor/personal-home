#!/bin/bash

# Vercel Postgres Automated Setup Script
# This script automates the complete setup of Vercel Postgres database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
FORCE_RESET="${2:-false}"

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    if [ "$major_version" -lt 18 ]; then
        print_error "Node.js version $node_version is too old. Please upgrade to Node.js 18 or later."
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install project dependencies
    npm ci
    
    # Install Vercel CLI globally if not present
    if ! command_exists vercel; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    print_success "Dependencies installed"
}

# Function to authenticate with Vercel
authenticate_vercel() {
    print_status "Authenticating with Vercel..."
    
    # Check if VERCEL_TOKEN is set (for CI/CD)
    if [ -n "$VERCEL_TOKEN" ]; then
        print_status "Using VERCEL_TOKEN for authentication"
        # No need for explicit login with token, just link project
        print_status "Linking project with token..."
        vercel link --yes --token $VERCEL_TOKEN
    else
        # Interactive login for local development
        print_status "Please login to Vercel (browser will open)..."
        vercel login
        
        # Link project after interactive login
        print_status "Linking project..."
        vercel link --yes
    fi
    
    print_success "Vercel authentication completed"
}

# Function to check if database exists
check_database_exists() {
    print_status "Checking if database exists..."
    
    local db_count=$(vercel storage ls ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} | grep -c "postgres" || echo "0")
    
    if [ "$db_count" -gt 0 ]; then
        print_success "Database already exists"
        return 0
    else
        print_status "Database does not exist"
        return 1
    fi
}

# Function to create database
create_database() {
    print_status "Creating Vercel Postgres database..."
    
    local db_name="music-playlist-db-$ENVIRONMENT"
    local region="us-east-1"  # Default region, can be customized
    
    # Create database
    vercel storage create postgres \
        --name "$db_name" \
        --region "$region" \
        ${VERCEL_TOKEN:+--token $VERCEL_TOKEN}
    
    print_success "Database '$db_name' created successfully"
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 30
}

# Function to setup environment variables
setup_environment_variables() {
    print_status "Setting up environment variables..."
    
    # Pull environment variables from Vercel
    print_status "Pulling environment variables from Vercel..."
    vercel env pull .env.local ${VERCEL_TOKEN:+--token $VERCEL_TOKEN}
    
    # Check if required database variables exist
    if ! grep -q "POSTGRES_URL" .env.local; then
        print_error "POSTGRES_URL not found in environment variables"
        print_error "Database creation may have failed. Please check Vercel dashboard."
        exit 1
    fi
    
    # Generate NEXTAUTH_SECRET if not exists
    if ! vercel env ls ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} | grep -q "NEXTAUTH_SECRET"; then
        print_status "Generating NEXTAUTH_SECRET..."
        local nextauth_secret=$(openssl rand -base64 32)
        
        vercel env add NEXTAUTH_SECRET production ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$nextauth_secret"
        vercel env add NEXTAUTH_SECRET preview ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$nextauth_secret"
        vercel env add NEXTAUTH_SECRET development ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$nextauth_secret"
        
        # Add to local env file
        echo "NEXTAUTH_SECRET=\"$nextauth_secret\"" >> .env.local
        
        print_success "NEXTAUTH_SECRET generated and set"
    fi
    
    # Set NEXTAUTH_URL
    local nextauth_url
    if [ "$ENVIRONMENT" = "production" ]; then
        nextauth_url="${PRODUCTION_DOMAIN:-https://music-playlist-manager.vercel.app}"
    else
        nextauth_url="${STAGING_DOMAIN:-https://music-playlist-manager-staging.vercel.app}"
    fi
    
    print_status "Setting NEXTAUTH_URL to $nextauth_url..."
    vercel env add NEXTAUTH_URL production --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$nextauth_url"
    vercel env add NEXTAUTH_URL preview --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$nextauth_url"
    
    # Add to local env file if not exists
    if ! grep -q "NEXTAUTH_URL" .env.local; then
        echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env.local
    fi
    
    # Set Spotify credentials if provided
    if [ -n "$SPOTIFY_CLIENT_ID" ]; then
        print_status "Setting Spotify credentials..."
        vercel env add SPOTIFY_CLIENT_ID production --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$SPOTIFY_CLIENT_ID"
        vercel env add SPOTIFY_CLIENT_ID preview --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$SPOTIFY_CLIENT_ID"
        
        if ! grep -q "SPOTIFY_CLIENT_ID" .env.local; then
            echo "SPOTIFY_CLIENT_ID=\"$SPOTIFY_CLIENT_ID\"" >> .env.local
        fi
    fi
    
    if [ -n "$SPOTIFY_CLIENT_SECRET" ]; then
        vercel env add SPOTIFY_CLIENT_SECRET production --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$SPOTIFY_CLIENT_SECRET"
        vercel env add SPOTIFY_CLIENT_SECRET preview --force ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} <<< "$SPOTIFY_CLIENT_SECRET"
        
        if ! grep -q "SPOTIFY_CLIENT_SECRET" .env.local; then
            echo "SPOTIFY_CLIENT_SECRET=\"$SPOTIFY_CLIENT_SECRET\"" >> .env.local
        fi
    fi
    
    print_success "Environment variables configured"
}

# Function to setup database schema
setup_database_schema() {
    print_status "Setting up database schema..."
    
    # Load environment variables
    set -a
    source .env.local
    set +a
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npm run db:generate
    
    # Run database migrations
    print_status "Running database migrations..."
    
    # Use non-pooling URL for migrations if available
    if [ -n "$POSTGRES_URL_NON_POOLING" ]; then
        export DATABASE_URL="$POSTGRES_URL_NON_POOLING"
    else
        export DATABASE_URL="$POSTGRES_URL"
    fi
    
    # Check if migrations directory exists
    if [ ! -d "prisma/migrations" ]; then
        print_status "Creating initial migration..."
        npx prisma migrate dev --name init --skip-generate
    else
        print_status "Deploying existing migrations..."
        npx prisma migrate deploy
    fi
    
    print_success "Database schema setup completed"
}

# Function to test database connection
test_database_connection() {
    print_status "Testing database connection..."
    
    # Load environment variables
    set -a
    source .env.local
    set +a
    
    # Run connection test
    if npm run db:test; then
        print_success "Database connection test passed"
    else
        print_error "Database connection test failed"
        exit 1
    fi
}

# Function to deploy application
deploy_application() {
    print_status "Building and deploying application..."
    
    # Build application
    print_status "Building application..."
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    
    local deployment_url
    if [ "$ENVIRONMENT" = "production" ]; then
        deployment_url=$(vercel --prod --yes ${VERCEL_TOKEN:+--token $VERCEL_TOKEN})
    else
        deployment_url=$(vercel --yes ${VERCEL_TOKEN:+--token $VERCEL_TOKEN})
    fi
    
    print_success "Deployed to: $deployment_url"
    
    # Test deployment
    print_status "Testing deployment..."
    sleep 30  # Wait for deployment to be ready
    
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$deployment_url" || echo "000")
    
    if [ "$http_status" = "200" ]; then
        print_success "Deployment is accessible"
    else
        print_warning "Deployment returned HTTP $http_status (may still be initializing)"
    fi
    
    echo "$deployment_url" > .deployment-url
}

# Function to create setup summary
create_setup_summary() {
    print_status "Creating setup summary..."
    
    local deployment_url=$(cat .deployment-url 2>/dev/null || echo "Not deployed")
    
    cat > SETUP_SUMMARY.md << EOF
# Vercel Postgres Setup Summary

**Date:** $(date -u)
**Environment:** $ENVIRONMENT
**Status:** ✅ Completed Successfully

## What was configured:

1. **Database:** Vercel Postgres database created and configured
2. **Environment Variables:** All required variables set in Vercel and locally
3. **Schema:** Database schema deployed with Prisma migrations
4. **Application:** Built and deployed to Vercel

## Deployment Information:

- **URL:** $deployment_url
- **Environment:** $ENVIRONMENT
- **Database Provider:** Vercel Postgres (Neon)

## Environment Variables Set:

- ✅ POSTGRES_URL
- ✅ POSTGRES_PRISMA_URL  
- ✅ POSTGRES_URL_NON_POOLING
- ✅ NEXTAUTH_SECRET (generated)
- ✅ NEXTAUTH_URL
$([ -n "$SPOTIFY_CLIENT_ID" ] && echo "- ✅ SPOTIFY_CLIENT_ID" || echo "- ⚠️ SPOTIFY_CLIENT_ID (not provided)")
$([ -n "$SPOTIFY_CLIENT_SECRET" ] && echo "- ✅ SPOTIFY_CLIENT_SECRET" || echo "- ⚠️ SPOTIFY_CLIENT_SECRET (not provided)")

## Next Steps:

1. **Visit your application:** $deployment_url
2. **Set up Spotify API:** Add your Spotify credentials if not already done
3. **Test authentication:** Try creating an account and logging in
4. **Monitor:** Use \`npm run db:test\` to check database health

## Local Development:

\`\`\`bash
# Start development server
npm run dev

# Test database connection
npm run db:test

# Open database admin
npm run db:studio
\`\`\`

## Useful Commands:

\`\`\`bash
# Deploy to production
vercel --prod

# Pull latest environment variables
vercel env pull .env.local

# Run database migrations
npm run db:migrate

# Check deployment status
vercel ls
\`\`\`

---
Generated by automated setup script at $(date -u)
EOF

    print_success "Setup summary created: SETUP_SUMMARY.md"
}

# Function to print final status
print_final_status() {
    local deployment_url=$(cat .deployment-url 2>/dev/null || echo "Not deployed")
    
    echo
    echo "================================================================"
    print_success "🎉 Vercel Postgres Setup Completed Successfully!"
    echo "================================================================"
    echo
    print_status "📊 Summary:"
    echo "  • Environment: $ENVIRONMENT"
    echo "  • Database: ✅ Created and configured"
    echo "  • Schema: ✅ Deployed"
    echo "  • Application: ✅ Built and deployed"
    echo "  • URL: $deployment_url"
    echo
    print_status "📋 Next steps:"
    echo "  1. Visit your application at: $deployment_url"
    echo "  2. Test the authentication flow"
    echo "  3. Add Spotify API credentials if needed"
    echo "  4. Start developing your music playlist features!"
    echo
    print_status "📚 Documentation:"
    echo "  • Setup summary: SETUP_SUMMARY.md"
    echo "  • Database guide: VERCEL_POSTGRES_SETUP.md"
    echo "  • Solution details: DATABASE_SETUP_SOLUTION.md"
    echo
    echo "================================================================"
}

# Main execution function
main() {
    echo
    echo "================================================================"
    echo "🚀 Vercel Postgres Automated Setup"
    echo "================================================================"
    echo
    print_status "Environment: $ENVIRONMENT"
    print_status "Force reset: $FORCE_RESET"
    echo
    
    check_prerequisites
    install_dependencies
    authenticate_vercel
    
    # Check if database exists
    if check_database_exists && [ "$FORCE_RESET" != "true" ]; then
        print_status "Using existing database"
    else
        if [ "$FORCE_RESET" = "true" ]; then
            print_warning "Force reset requested - will recreate database"
        fi
        create_database
    fi
    
    setup_environment_variables
    setup_database_schema
    test_database_connection
    deploy_application
    create_setup_summary
    print_final_status
    
    # Cleanup
    rm -f .deployment-url
}

# Script usage information
usage() {
    echo "Usage: $0 [environment] [force_reset]"
    echo
    echo "Arguments:"
    echo "  environment   Target environment (staging|production) [default: staging]"
    echo "  force_reset   Force database reset (true|false) [default: false]"
    echo
    echo "Environment Variables:"
    echo "  VERCEL_TOKEN           Vercel authentication token (for CI/CD)"
    echo "  SPOTIFY_CLIENT_ID      Spotify API client ID"
    echo "  SPOTIFY_CLIENT_SECRET  Spotify API client secret"
    echo "  PRODUCTION_DOMAIN      Production domain override"
    echo "  STAGING_DOMAIN         Staging domain override"
    echo
    echo "Examples:"
    echo "  $0                     # Setup staging environment"
    echo "  $0 production          # Setup production environment"
    echo "  $0 staging true        # Reset staging database"
    echo
}

# Handle help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Validate environment argument
if [ -n "$1" ] && [ "$1" != "staging" ] && [ "$1" != "production" ]; then
    print_error "Invalid environment: $1"
    echo "Valid options: staging, production"
    echo
    usage
    exit 1
fi

# Run main function
main "$@"