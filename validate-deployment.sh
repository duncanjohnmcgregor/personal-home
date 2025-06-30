#!/bin/bash

# Validate deployment requirements for personal-home-kappa.vercel.app
set -e

echo "🔍 Validating deployment requirements..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALID=true

# Check if required commands exist
echo "📋 Checking required tools..."

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
fi

if ! command -v npx >/dev/null 2>&1; then
    echo -e "${RED}❌ npx not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ npx found${NC}"
fi

# Check package.json
echo ""
echo "📦 Checking project configuration..."

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ package.json found${NC}"
fi

if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ vercel.json not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ vercel.json found${NC}"
fi

# Check Prisma configuration
echo ""
echo "🗄️ Checking database configuration..."

if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Prisma schema not found${NC}"
    VALID=false
else
    echo -e "${GREEN}✅ Prisma schema found${NC}"
fi

# Check environment variables
echo ""
echo "🔧 Checking environment variables..."

if [ -z "$SPOTIFY_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️ SPOTIFY_CLIENT_ID not set (required for deployment)${NC}"
    echo "   Get it from: https://developer.spotify.com/dashboard"
else
    echo -e "${GREEN}✅ SPOTIFY_CLIENT_ID is set${NC}"
fi

if [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠️ SPOTIFY_CLIENT_SECRET not set (required for deployment)${NC}"
    echo "   Get it from: https://developer.spotify.com/dashboard"
else
    echo -e "${GREEN}✅ SPOTIFY_CLIENT_SECRET is set${NC}"
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️ DATABASE_URL not set (required for deployment)${NC}"
    echo "   Use a managed database like Supabase, Neon, or Railway"
else
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo -e "${YELLOW}⚠️ NEXTAUTH_SECRET not set (will be generated automatically)${NC}"
else
    echo -e "${GREEN}✅ NEXTAUTH_SECRET is set${NC}"
fi

# Test npm install
echo ""
echo "📦 Testing dependency installation..."

if npm ci >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Dependencies install successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    VALID=false
fi

# Test Prisma generation
echo ""
echo "🗃️ Testing Prisma client generation..."

if npx prisma generate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma client generates successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    VALID=false
fi

# Test build
echo ""
echo "🔨 Testing application build..."

if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Application builds successfully${NC}"
else
    echo -e "${RED}❌ Application build failed${NC}"
    VALID=false
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ "$VALID" = true ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo ""
    echo "🚀 Ready to deploy to: https://personal-home-kappa.vercel.app"
    echo ""
    echo "Next steps:"
    echo "1. Set up your Spotify app redirect URI:"
    echo "   https://personal-home-kappa.vercel.app/api/auth/callback/spotify"
    echo ""
    echo "2. Set environment variables and deploy:"
    echo "   SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret DATABASE_URL=your_db ./deploy-to-personal-home.sh"
else
    echo -e "${RED}❌ Some validation checks failed${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
fi

# Spotify configuration reminder
echo ""
echo "🎵 Spotify Configuration Reminder"
echo "=================================="
echo "Make sure your Spotify Developer App has this redirect URI:"
echo "https://personal-home-kappa.vercel.app/api/auth/callback/spotify"
echo ""
echo "Get your Spotify credentials from:"
echo "https://developer.spotify.com/dashboard"