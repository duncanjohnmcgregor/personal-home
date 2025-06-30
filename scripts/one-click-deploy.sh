#!/bin/bash

# Music Playlist Manager - One-Click Deployment
# Usage: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx ./scripts/one-click-deploy.sh

set -e

echo "🚀 One-Click Deployment Starting..."

# Check if environment variables are provided
if [ -z "$SPOTIFY_CLIENT_ID" ] || [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
    echo "❌ Missing required environment variables."
    echo ""
    echo "Usage:"
    echo "SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret ./scripts/one-click-deploy.sh"
    echo ""
    echo "Get your Spotify credentials from: https://developer.spotify.com/dashboard"
    exit 1
fi

# Install global dependencies if needed
if ! command -v vercel >/dev/null 2>&1; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

if ! command -v gh >/dev/null 2>&1; then
    echo "📦 Installing GitHub CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    else
        echo "Please install GitHub CLI: https://cli.github.com/manual/installation"
        exit 1
    fi
fi

# Login if needed
echo "🔐 Checking authentication..."
gh auth login --web || true
vercel login || true

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create GitHub repo if needed
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "Initial commit"
fi

PROJECT_NAME="music-playlist-$(date +%s)"
gh repo create $PROJECT_NAME --public --source=. --remote=origin --push || true

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --yes --name $PROJECT_NAME

# Set environment variables
DEPLOYMENT_URL="https://$PROJECT_NAME.vercel.app"
vercel env add NEXTAUTH_URL production <<< "$DEPLOYMENT_URL"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add SPOTIFY_CLIENT_ID production <<< "$SPOTIFY_CLIENT_ID"
vercel env add SPOTIFY_CLIENT_SECRET production <<< "$SPOTIFY_CLIENT_SECRET"

# Use Vercel Postgres (automatic database)
echo "📊 Setting up Vercel Postgres..."
vercel postgres create --name "$PROJECT_NAME-db"
DB_URL=$(vercel env ls | grep POSTGRES_URL | head -1 | awk '{print $2}')
if [ -n "$DB_URL" ]; then
    vercel env add DATABASE_URL production <<< "$DB_URL"
fi

# Deploy to production
vercel --prod --yes

echo ""
echo "🎉 ONE-CLICK DEPLOYMENT COMPLETE!"
echo ""
echo "📱 Your app is live at: $DEPLOYMENT_URL"
echo "🔧 Update your Spotify app redirect URI to: $DEPLOYMENT_URL/api/auth/callback/spotify"
echo ""
echo "✅ Ready to use! Visit your live app now! 🎵"