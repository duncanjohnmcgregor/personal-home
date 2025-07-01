#!/bin/bash

# 🔧 Fix Vercel Environment Variables Script
# This script helps you configure the missing environment variables in Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo ""
    echo "=============================================="
    echo "🔧 Vercel Environment Variables Fix"
    echo "=============================================="
    echo ""
}

# Check if vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    else
        print_success "Vercel CLI is installed"
    fi
}

# Check if user is logged in to Vercel
check_vercel_auth() {
    print_status "Checking Vercel authentication..."
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please login:"
        vercel login
    else
        print_success "Logged in to Vercel as: $(vercel whoami)"
    fi
}

# Link project if not already linked
link_project() {
    print_status "Checking project link..."
    if [ ! -f ".vercel/project.json" ]; then
        print_warning "Project not linked. Linking now..."
        vercel link
    else
        print_success "Project is already linked"
    fi
}

# Show current environment variables
show_current_env() {
    print_status "Current environment variables in Vercel:"
    echo ""
    vercel env ls || print_warning "Could not fetch environment variables"
    echo ""
}

# Generate NEXTAUTH_SECRET if needed
generate_nextauth_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    else
        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    fi
}

# Add missing environment variables
add_environment_variables() {
    print_status "Adding missing environment variables..."
    
    # Check which variables are missing
    ENV_OUTPUT=$(vercel env ls 2>/dev/null || echo "")
    
    # Add POSTGRES_PRISMA_URL if missing
    if ! echo "$ENV_OUTPUT" | grep -q "POSTGRES_PRISMA_URL"; then
        print_warning "POSTGRES_PRISMA_URL is missing. Adding..."
        echo "Enter your Postgres pooled connection string (with pgbouncer=true):"
        vercel env add POSTGRES_PRISMA_URL
    fi
    
    # Add POSTGRES_URL_NON_POOLING if missing
    if ! echo "$ENV_OUTPUT" | grep -q "POSTGRES_URL_NON_POOLING"; then
        print_warning "POSTGRES_URL_NON_POOLING is missing. Adding..."
        echo "Enter your Postgres direct connection string:"
        vercel env add POSTGRES_URL_NON_POOLING
    fi
    
    # Add NEXTAUTH_SECRET if missing
    if ! echo "$ENV_OUTPUT" | grep -q "NEXTAUTH_SECRET"; then
        print_warning "NEXTAUTH_SECRET is missing. Generating and adding..."
        SECRET=$(generate_nextauth_secret)
        echo "$SECRET" | vercel env add NEXTAUTH_SECRET
        print_success "Generated and added NEXTAUTH_SECRET"
    fi
    
    # Add NEXTAUTH_URL if missing
    if ! echo "$ENV_OUTPUT" | grep -q "NEXTAUTH_URL"; then
        print_warning "NEXTAUTH_URL is missing. Adding..."
        echo "Enter your deployed URL (e.g., https://your-app.vercel.app):"
        vercel env add NEXTAUTH_URL
    fi
    
    # Add Spotify credentials if missing
    if ! echo "$ENV_OUTPUT" | grep -q "SPOTIFY_CLIENT_ID"; then
        print_warning "SPOTIFY_CLIENT_ID is missing. Adding..."
        echo "Enter your Spotify Client ID:"
        vercel env add SPOTIFY_CLIENT_ID
    fi
    
    if ! echo "$ENV_OUTPUT" | grep -q "SPOTIFY_CLIENT_SECRET"; then
        print_warning "SPOTIFY_CLIENT_SECRET is missing. Adding..."
        echo "Enter your Spotify Client Secret:"
        vercel env add SPOTIFY_CLIENT_SECRET
    fi
}

# Pull environment variables locally
pull_env_variables() {
    print_status "Pulling environment variables to .env.local..."
    vercel env pull .env.local
    print_success "Environment variables pulled to .env.local"
}

# Redeploy application
redeploy_app() {
    print_status "Redeploying application..."
    read -p "Do you want to redeploy to production now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel --prod
        print_success "Application redeployed to production"
    else
        print_warning "Skipping deployment. Remember to redeploy manually:"
        echo "  vercel --prod"
    fi
}

# Main function
main() {
    print_header
    
    # Pre-flight checks
    check_vercel_cli
    check_vercel_auth
    link_project
    
    # Show current state
    show_current_env
    
    # Add missing variables
    add_environment_variables
    
    # Pull variables locally
    pull_env_variables
    
    # Offer to redeploy
    redeploy_app
    
    print_success "Environment variables setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test your database connection: npm run db:test"
    echo "2. Initialize database if needed: npm run db:push"
    echo "3. Test your deployed app: https://your-app.vercel.app"
    echo ""
    echo "If you still have issues, check the generated VERCEL_ENVIRONMENT_VARIABLES_FIX.md file."
}

# Run main function
main "$@"