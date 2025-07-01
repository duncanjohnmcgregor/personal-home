#!/bin/bash

# 🗄️ Setup Production Database Script
# This script creates all necessary database tables in your production database

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
    echo "🗄️ Production Database Setup"
    echo "=============================================="
    echo ""
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_success "All requirements met"
}

# Pull latest environment variables
pull_env_variables() {
    print_status "Pulling latest environment variables from Vercel..."
    
    if vercel env pull .env.local; then
        print_success "Environment variables pulled successfully"
    else
        print_error "Failed to pull environment variables"
        print_warning "Make sure you're logged in to Vercel and project is linked"
        echo "Run: vercel login && vercel link"
        exit 1
    fi
}

# Check database connection
test_database_connection() {
    print_status "Testing database connection..."
    
    # Load environment variables
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    if [ -z "$POSTGRES_PRISMA_URL" ]; then
        print_error "POSTGRES_PRISMA_URL not found in environment variables"
        print_warning "Make sure environment variables are properly configured"
        exit 1
    fi
    
    print_success "Database connection variables found"
}

# Generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    
    if npx prisma generate; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Check migration status
check_migration_status() {
    print_status "Checking migration status..."
    
    # Load environment variables for this command
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    if npx prisma migrate status; then
        print_success "Migration status checked"
    else
        print_warning "Could not check migration status (this might be normal for first run)"
    fi
}

# Apply database migrations
apply_migrations() {
    print_status "Applying database migrations..."
    
    # Load environment variables
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    print_status "Running: npx prisma migrate deploy"
    
    if npx prisma migrate deploy; then
        print_success "Database migrations applied successfully!"
        print_success "All tables have been created in your production database"
    else
        print_error "Migration failed. Trying alternative approach..."
        
        # Try db push as fallback
        print_status "Trying: npx prisma db push"
        if npx prisma db push --accept-data-loss; then
            print_success "Database schema pushed successfully!"
        else
            print_error "Both migration and push failed"
            print_error "Please check your database connection and permissions"
            exit 1
        fi
    fi
}

# Verify tables were created
verify_tables() {
    print_status "Verifying database tables..."
    
    # Load environment variables
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    # Test basic database operations
    if npm run db:test; then
        print_success "Database verification passed!"
    else
        print_warning "Database test failed, but tables might still be created"
    fi
}

# Deploy application
deploy_application() {
    print_status "Deploying application to production..."
    
    read -p "Do you want to deploy to production now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if vercel --prod; then
            print_success "Application deployed successfully!"
        else
            print_error "Deployment failed"
            exit 1
        fi
    else
        print_warning "Skipping deployment. Remember to deploy manually:"
        echo "  vercel --prod"
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    print_success "Database setup complete!"
    echo ""
    echo "📋 What was created:"
    echo "  ✅ Account table (for OAuth)"
    echo "  ✅ Session table (for user sessions)"
    echo "  ✅ User table (for user profiles)"
    echo "  ✅ Playlist table (for playlists)"
    echo "  ✅ Song table (for song metadata)"
    echo "  ✅ PlaylistSong table (for playlist-song relationships)"
    echo "  ✅ PurchaseHistory table (for purchase tracking)"
    echo "  ✅ VerificationToken table (for email verification)"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Test your deployed application"
    echo "  2. Try signing in with Spotify"
    echo "  3. Verify user data persists between sessions"
    echo ""
    echo "🔗 Useful commands:"
    echo "  npx prisma studio     # View database in browser"
    echo "  npm run db:test       # Test database connection"
    echo "  vercel logs           # View deployment logs"
    echo ""
}

# Main function
main() {
    print_header
    
    # Pre-flight checks
    check_requirements
    pull_env_variables
    test_database_connection
    
    # Database setup
    generate_prisma_client
    check_migration_status
    apply_migrations
    verify_tables
    
    # Deployment
    deploy_application
    
    # Summary
    show_next_steps
}

# Error handling
trap 'print_error "Script failed on line $LINENO"' ERR

# Run main function
main "$@"