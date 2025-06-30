#!/bin/bash

# Simple deployment script for existing project
set -e

echo "🚀 Simple Deployment Starting..."

# Check if Vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    echo "❌ Vercel CLI is required. Install with: npm install -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami >/dev/null 2>&1; then
    echo "🔐 Please log in to Vercel first:"
    vercel login
fi

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod --yes

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Your app should be live at your Vercel URL"
echo "" 