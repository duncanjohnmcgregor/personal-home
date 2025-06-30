#!/bin/bash

# Authentication Fix Script
# This script helps fix common authentication issues

echo "🔧 Music Playlist Manager - Authentication Fix Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}1. Checking environment files...${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local from template${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

echo ""
echo -e "${BLUE}2. Generating NEXTAUTH_SECRET...${NC}"

# Generate a secure secret
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated secure secret: ${SECRET}${NC}"
    echo ""
    echo -e "${YELLOW}Add this to your .env.local file:${NC}"
    echo "NEXTAUTH_SECRET=${SECRET}"
else
    echo -e "${RED}❌ OpenSSL not found. Please generate a secret manually:${NC}"
    echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
fi

echo ""
echo -e "${BLUE}3. Environment Variable Checklist${NC}"
echo "=================================================="
echo ""
echo "Make sure these are set in your .env.local:"
echo "✓ NEXTAUTH_SECRET (generated above)"
echo "✓ NEXTAUTH_URL=http://localhost:3000"
echo "✓ SPOTIFY_CLIENT_ID (from Spotify Developer Dashboard)"
echo "✓ SPOTIFY_CLIENT_SECRET (from Spotify Developer Dashboard)"
echo "✓ DATABASE_URL (your database connection string)"

echo ""
echo -e "${BLUE}4. Vercel Environment Variables${NC}"
echo "=================================================="
echo ""
echo "Run these commands to set production environment variables:"
echo ""
echo -e "${YELLOW}npx vercel env add NEXTAUTH_SECRET production${NC}"
echo -e "${YELLOW}npx vercel env add NEXTAUTH_URL production${NC}"
echo -e "${YELLOW}npx vercel env add SPOTIFY_CLIENT_ID production${NC}"
echo -e "${YELLOW}npx vercel env add SPOTIFY_CLIENT_SECRET production${NC}"
echo -e "${YELLOW}npx vercel env add DATABASE_URL production${NC}"

echo ""
echo -e "${BLUE}5. Spotify App Configuration${NC}"
echo "=================================================="
echo ""
echo "In your Spotify Developer Dashboard, add these Redirect URIs:"
echo "• Development: http://localhost:3000/api/auth/callback/spotify"
echo "• Production: https://personal-home-kappa.vercel.app/api/auth/callback/spotify"

echo ""
echo -e "${BLUE}6. Quick Deployment${NC}"
echo "=================================================="
echo ""
echo "After setting environment variables, redeploy:"
echo -e "${YELLOW}npx vercel --prod${NC}"

echo ""
echo -e "${GREEN}🎉 Authentication fix script complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env.local with actual Spotify credentials"
echo "2. Set production environment variables in Vercel"
echo "3. Configure Spotify app redirect URIs"
echo "4. Redeploy your application"
echo ""
echo "For detailed instructions, see: AUTHENTICATION_FIX_GUIDE.md"