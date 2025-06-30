#!/bin/bash

# Vercel Setup Helper Script
# This script guides you through setting up Vercel deployment

set -e

echo "🚀 Vercel Deployment Setup Helper"
echo "=================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "🔐 Setting up Vercel authentication..."
echo "This will open your browser to login to Vercel"
read -p "Press Enter to continue..."

vercel login

echo ""
echo "🔗 Linking your project to Vercel..."
echo "Follow the prompts to link your project"
read -p "Press Enter to continue..."

vercel link

echo ""
echo "📋 Getting project information..."

if [ -f ".vercel/project.json" ]; then
    echo ""
    echo "✅ Project linked successfully!"
    echo ""
    echo "📝 Here's your project information for GitHub Secrets:"
    echo "=================================================="
    
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | sed 's/"orgId":"//')
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | sed 's/"projectId":"//')
    
    echo ""
    echo "🔑 Required GitHub Secret:"
    echo "VERCEL_TOKEN = [Get this from https://vercel.com/account/tokens]"
    echo ""
    echo "📋 Optional secrets (for advanced workflows):"
    echo "VERCEL_ORG_ID = $ORG_ID"
    echo "VERCEL_PROJECT_ID = $PROJECT_ID"
    echo ""
    
    echo "🎯 Next Steps:"
    echo "1. Go to https://vercel.com/account/tokens"
    echo "2. Create a new token named 'GitHub Actions'"
    echo "3. Copy the token"
    echo "4. Go to your GitHub repo → Settings → Secrets and variables → Actions"
    echo "5. Add a new secret called 'VERCEL_TOKEN' with the token value"
    echo "6. Push a commit to trigger deployment!"
    echo ""
    
else
    echo "❌ Project linking failed. Please try running 'vercel link' manually."
    exit 1
fi

echo "🌟 Setup complete! Your next push to main branch will deploy to Vercel."