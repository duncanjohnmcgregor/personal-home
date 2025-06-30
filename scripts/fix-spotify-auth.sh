#!/bin/bash

# Spotify Authentication Fix Script
# This script helps fix the callback error by setting up the correct environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Spotify Authentication Fix Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI is available${NC}"
echo ""

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to Vercel...${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"
echo ""

# Link project if not already linked
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}🔗 Linking project to Vercel...${NC}"
    vercel link
fi

echo -e "${GREEN}✅ Project linked to Vercel${NC}"
echo ""

# Generate NEXTAUTH_SECRET if not provided
if command -v openssl &> /dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated secure NEXTAUTH_SECRET${NC}"
else
    NEXTAUTH_SECRET="please-change-this-to-a-secure-32-character-string"
    echo -e "${YELLOW}⚠️  OpenSSL not found. Using placeholder NEXTAUTH_SECRET${NC}"
    echo -e "${YELLOW}   Please generate a secure secret: https://generate-secret.vercel.app/32${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Setting up environment variables...${NC}"
echo ""

# Set NEXTAUTH_URL
echo -e "${YELLOW}Setting NEXTAUTH_URL...${NC}"
echo "https://personal-home-kappa.vercel.app" | vercel env add NEXTAUTH_URL production

# Set NEXTAUTH_SECRET
echo -e "${YELLOW}Setting NEXTAUTH_SECRET...${NC}"
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production

echo ""
echo -e "${YELLOW}📝 Now you need to add your Spotify credentials:${NC}"
echo ""

# Prompt for Spotify credentials
echo -e "${BLUE}Please enter your Spotify Client ID:${NC}"
read -r SPOTIFY_CLIENT_ID

echo -e "${BLUE}Please enter your Spotify Client Secret:${NC}"
read -r -s SPOTIFY_CLIENT_SECRET

if [ -n "$SPOTIFY_CLIENT_ID" ] && [ -n "$SPOTIFY_CLIENT_SECRET" ]; then
    echo -e "${YELLOW}Setting Spotify credentials...${NC}"
    echo "$SPOTIFY_CLIENT_ID" | vercel env add SPOTIFY_CLIENT_ID production
    echo "$SPOTIFY_CLIENT_SECRET" | vercel env add SPOTIFY_CLIENT_SECRET production
    echo -e "${GREEN}✅ Spotify credentials set${NC}"
else
    echo -e "${RED}❌ Spotify credentials not provided. You'll need to set them manually.${NC}"
fi

echo ""
echo -e "${BLUE}🗄️  Database Setup${NC}"
echo -e "${YELLOW}Your app uses database sessions. Choose an option:${NC}"
echo ""
echo "1) Create Vercel Postgres database (Recommended)"
echo "2) I have an external database URL"
echo "3) Switch to JWT sessions (no database needed)"
echo ""
read -p "Choose option (1-3): " DB_CHOICE

case $DB_CHOICE in
    1)
        echo -e "${YELLOW}Creating Vercel Postgres database...${NC}"
        vercel storage create postgres
        echo -e "${GREEN}✅ Vercel Postgres database created${NC}"
        echo -e "${YELLOW}Pulling environment variables...${NC}"
        vercel env pull .env.local
        ;;
    2)
        echo -e "${BLUE}Please enter your database URL:${NC}"
        read -r DATABASE_URL
        if [ -n "$DATABASE_URL" ]; then
            echo "$DATABASE_URL" | vercel env add DATABASE_URL production
            echo -e "${GREEN}✅ Database URL set${NC}"
        else
            echo -e "${RED}❌ Database URL not provided${NC}"
        fi
        ;;
    3)
        echo -e "${YELLOW}📝 To switch to JWT sessions:${NC}"
        echo "1. Edit src/lib/auth.ts"
        echo "2. Comment out: adapter: PrismaAdapter(prisma)"
        echo "3. Change to: strategy: 'jwt'"
        echo "4. Redeploy your app"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Invalid option. Skipping database setup.${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}🚀 Deploying application with new environment variables...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 IMPORTANT: Update your Spotify App Settings${NC}"
echo -e "${YELLOW}1. Go to: https://developer.spotify.com/dashboard${NC}"
echo -e "${YELLOW}2. Select your app${NC}"
echo -e "${YELLOW}3. Click 'Edit Settings'${NC}"
echo -e "${YELLOW}4. Add this Redirect URI:${NC}"
echo -e "${GREEN}   https://personal-home-kappa.vercel.app/api/auth/callback/spotify${NC}"
echo -e "${YELLOW}5. Click 'SAVE'${NC}"
echo ""
echo -e "${BLUE}🧪 Test your authentication:${NC}"
echo -e "${GREEN}Visit: https://personal-home-kappa.vercel.app${NC}"
echo ""
echo -e "${GREEN}🎉 Authentication should now work properly!${NC}"