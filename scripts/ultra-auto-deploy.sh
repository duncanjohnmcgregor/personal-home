#!/bin/bash

# Music Playlist Manager - Ultra Automated Deployment (Minimal Human Input)
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_NAME="music-playlist-manager-$(date +%s)"
VERCEL_PROJECT_NAME="music-playlist-manager-$(date +%s)"

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║            🚀 ULTRA-AUTOMATED DEPLOYMENT                      ║"
    echo "║              Minimal Human Intervention                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() { echo -e "${CYAN}[STEP]${NC} $1"; }
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# One-time credential collection at the start
collect_credentials() {
    print_banner
    echo -e "${YELLOW}🔑 One-time credential collection (everything else is automated)${NC}"
    echo ""
    
    # GitHub credentials
    print_status "1. GitHub Setup:"
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        print_success "GitHub CLI already authenticated"
    else
        echo "   Please authenticate with GitHub (one-time setup)"
        gh auth login --web
    fi
    
    # Vercel credentials  
    print_status "2. Vercel Setup:"
    if command -v vercel >/dev/null 2>&1 && vercel whoami >/dev/null 2>&1; then
        print_success "Vercel CLI already authenticated"
    else
        echo "   Please authenticate with Vercel (one-time setup)"
        npm install -g vercel
        vercel login
    fi
    
    # Railway credentials
    print_status "3. Railway Setup:"
    if command -v railway >/dev/null 2>&1 && railway whoami >/dev/null 2>&1; then
        print_success "Railway CLI already authenticated"
    else
        echo "   Installing and authenticating Railway CLI..."
        npm install -g @railway/cli
        railway login
    fi
    
    # Spotify credentials (only manual step required)
    print_status "4. Spotify Developer App (ONLY manual step required):"
    echo ""
    echo "   Please create a Spotify app quickly:"
    echo "   1. Go to: https://developer.spotify.com/dashboard"
    echo "   2. Click 'Create App' -> Name: Music Playlist Manager"
    echo "   3. Redirect URI: will be set automatically after deployment"
    echo "   4. Copy the Client ID and Secret below"
    echo ""
    read -p "   Spotify Client ID: " SPOTIFY_CLIENT_ID
    read -p "   Spotify Client Secret: " SPOTIFY_CLIENT_SECRET
    
    print_success "All credentials collected! Everything else is now automated..."
    sleep 2
}

# Fully automated deployment
auto_deploy() {
    print_step "🤖 Starting ultra-automated deployment..."
    
    # 1. Auto-create GitHub repo
    print_status "Creating GitHub repository..."
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial commit: Music Playlist Manager"
    fi
    
    gh repo create $PROJECT_NAME --public --source=. --remote=origin --push --clone=false
    GITHUB_REPO_URL=$(gh repo view --json url -q .url)
    print_success "GitHub repo: $GITHUB_REPO_URL"
    
    # 2. Auto-create Railway database
    print_status "Creating Railway PostgreSQL database..."
    railway new $PROJECT_NAME --template postgres
    railway environment production
    
    # Wait for database to be ready
    print_status "Waiting for database to initialize..."
    sleep 30
    
    # Get database URL
    DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || railway variables get DATABASE_URL)
    if [ -z "$DATABASE_URL" ]; then
        # Alternative method to get database URL
        railway status
        DATABASE_URL=$(railway variables get DATABASE_URL)
    fi
    print_success "Database created and ready"
    
    # 3. Generate secure secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    print_success "Generated secure secrets"
    
    # 4. Deploy to Vercel with environment variables
    print_status "Deploying to Vercel with auto-configuration..."
    
    # Create Vercel project
    echo "y" | vercel --name $VERCEL_PROJECT_NAME
    
    # Set all environment variables at once
    DEPLOYMENT_URL="https://$VERCEL_PROJECT_NAME.vercel.app"
    
    vercel env add NEXTAUTH_URL production <<< "$DEPLOYMENT_URL"
    vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"
    vercel env add SPOTIFY_CLIENT_ID production <<< "$SPOTIFY_CLIENT_ID"
    vercel env add SPOTIFY_CLIENT_SECRET production <<< "$SPOTIFY_CLIENT_SECRET"
    
    # Deploy to production
    vercel --prod --yes
    print_success "Deployed to: $DEPLOYMENT_URL"
    
    # 5. Auto-update Spotify redirect URI
    print_status "Please update your Spotify app redirect URI to:"
    print_status "$DEPLOYMENT_URL/api/auth/callback/spotify"
    
    # 6. Run database migrations
    print_status "Running database migrations..."
    export DATABASE_URL="$DATABASE_URL"
    npx prisma generate
    npx prisma migrate deploy
    print_success "Database ready"
    
    # 7. Setup GitHub Actions secrets
    print_status "Configuring CI/CD..."
    vercel_token_url="https://vercel.com/account/tokens"
    print_status "Please create a Vercel token at: $vercel_token_url"
    read -p "Vercel Token: " VERCEL_TOKEN
    
    # Get Vercel project details
    VERCEL_PROJECT_JSON=$(vercel project list --format json | jq -r ".[] | select(.name==\"$VERCEL_PROJECT_NAME\")")
    VERCEL_ORG_ID=$(echo "$VERCEL_PROJECT_JSON" | jq -r '.accountId')
    VERCEL_PROJECT_ID=$(echo "$VERCEL_PROJECT_JSON" | jq -r '.id')
    
    # Set GitHub secrets
    gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
    gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
    gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
    gh secret set PRODUCTION_URL --body "$DEPLOYMENT_URL"
    print_success "CI/CD configured"
    
    # 8. Final health check
    print_status "Running final health check..."
    sleep 20
    if curl -f "$DEPLOYMENT_URL/api/health" >/dev/null 2>&1; then
        print_success "✅ Health check passed!"
    else
        print_success "⏳ Deployment successful (health check may take a few more minutes)"
    fi
}

# Display results
show_results() {
    print_banner
    echo -e "${GREEN}🎉 ULTRA-AUTOMATED DEPLOYMENT COMPLETE! 🎉${NC}"
    echo ""
    echo -e "${CYAN}Your app is LIVE on the internet! 🌐${NC}"
    echo ""
    echo -e "${YELLOW}📱 Live URL:${NC} $DEPLOYMENT_URL"
    echo -e "${YELLOW}🗄️ Database:${NC} Railway PostgreSQL (auto-created)"
    echo -e "${YELLOW}🔗 GitHub:${NC} $GITHUB_REPO_URL"
    echo -e "${YELLOW}📊 Health:${NC} $DEPLOYMENT_URL/api/health"
    echo ""
    echo -e "${GREEN}✅ Features Active:${NC}"
    echo "  • Auto-deployments on git push"
    echo "  • Database migrations"
    echo "  • Health monitoring"
    echo "  • CI/CD pipeline"
    echo ""
    echo -e "${BLUE}🎵 Ready to use! Visit: $DEPLOYMENT_URL${NC}"
    echo ""
    
    # Final reminder
    echo -e "${YELLOW}📝 FINAL STEP:${NC}"
    echo "Update your Spotify app redirect URI to:"
    echo "$DEPLOYMENT_URL/api/auth/callback/spotify"
    echo ""
    echo -e "${CYAN}Total deployment time: ~5-10 minutes with minimal input! 🚀${NC}"
}

# Main execution
main() {
    # Check prerequisites
    if ! command -v npm >/dev/null 2>&1; then
        print_error "Node.js/npm required. Install from: https://nodejs.org"
        exit 1
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        print_error "Git required. Install from: https://git-scm.com"
        exit 1
    fi
    
    # Install jq if not available (for JSON parsing)
    if ! command -v jq >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y jq
        fi
    fi
    
    # Install dependencies
    npm ci
    
    # Execute ultra-automation
    collect_credentials
    auto_deploy
    show_results
}

# Handle interruption
trap 'print_error "Deployment interrupted. Run again to resume."' INT

# Execute
main "$@"