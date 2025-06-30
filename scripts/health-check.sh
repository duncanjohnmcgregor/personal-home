#!/bin/bash

# Music Playlist Manager - Health Check Script
set -e

# Configuration
ENVIRONMENT=${1:-production}
TIMEOUT=${2:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[HEALTH CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Determine URL based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    BASE_URL=${PRODUCTION_URL:-"https://music-playlist-manager.vercel.app"}
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    BASE_URL=${STAGING_URL:-"https://music-playlist-manager-staging.vercel.app"}
else
    BASE_URL=${BASE_URL:-"http://localhost:3000"}
fi

print_status "Running health checks for $ENVIRONMENT environment..."
print_status "Target URL: $BASE_URL"

# Health check endpoints
ENDPOINTS=(
    "/api/health"
    "/api/auth/session"
    "/"
)

# Function to check a single endpoint
check_endpoint() {
    local endpoint=$1
    local url="$BASE_URL$endpoint"
    
    print_status "Checking: $url"
    
    if curl -f -s -m $TIMEOUT "$url" >/dev/null 2>&1; then
        print_success "✅ $endpoint - OK"
        return 0
    else
        print_error "❌ $endpoint - FAILED"
        return 1
    fi
}

# Run all health checks
failed_checks=0
total_checks=${#ENDPOINTS[@]}

print_status "Running $total_checks health checks..."

for endpoint in "${ENDPOINTS[@]}"; do
    if ! check_endpoint "$endpoint"; then
        ((failed_checks++))
    fi
    sleep 1
done

# Summary
print_status "Health check summary:"
echo "  Total checks: $total_checks"
echo "  Passed: $((total_checks - failed_checks))"
echo "  Failed: $failed_checks"

if [[ $failed_checks -eq 0 ]]; then
    print_success "All health checks passed! 🎉"
    exit 0
else
    print_error "Some health checks failed. Please investigate."
    exit 1
fi