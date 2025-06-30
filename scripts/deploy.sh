#!/bin/bash

# Music Playlist Manager - Manual Deployment Script
set -e

echo "🚀 Starting deployment process..."

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="music-playlist-manager"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_status "Deploying to $ENVIRONMENT environment..."

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
command -v vercel >/dev/null 2>&1 || { print_error "Vercel CLI is required but not installed. Run: npm i -g vercel"; exit 1; }

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run quality checks
print_status "Running type checks..."
npm run type-check || { print_error "Type check failed"; exit 1; }

print_status "Running linting..."
npm run lint || { print_error "Linting failed"; exit 1; }

print_status "Building application..."
npm run build || { print_error "Build failed"; exit 1; }

# Deploy based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Deploying to production..."
    vercel --prod --yes
else
    print_status "Deploying to staging..."
    vercel --yes
fi

print_success "Deployment to $ENVIRONMENT completed successfully!"

# Run health check
print_status "Running post-deployment health check..."
sleep 10

if [[ "$ENVIRONMENT" == "production" ]]; then
    if curl -f "${VERCEL_URL:-https://music-playlist-manager.vercel.app}/api/health" >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed - please verify deployment manually"
    fi
fi

print_success "Deployment process completed! 🎉"