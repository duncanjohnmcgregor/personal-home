#!/bin/bash

# Music Playlist Manager - Database Migration Script
set -e

# Configuration
ENVIRONMENT=${1:-development}
MIGRATION_NAME=${2:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[MIGRATE]${NC} $1"
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
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'development', 'staging', or 'production'"
    exit 1
fi

print_status "Running database migrations for $ENVIRONMENT environment..."

# Check if Prisma is available
command -v npx >/dev/null 2>&1 || { print_error "npm/npx is required but not installed. Aborting."; exit 1; }

# Load environment variables based on environment
case $ENVIRONMENT in
    "development")
        if [ -f ".env.local" ]; then
            print_status "Loading development environment from .env.local"
            export $(grep -v '^#' .env.local | xargs)
        else
            print_warning "No .env.local file found. Using default development settings."
        fi
        ;;
    "staging")
        if [ -f ".env.staging" ]; then
            print_status "Loading staging environment from .env.staging"
            export $(grep -v '^#' .env.staging | xargs)
        else
            print_error "No .env.staging file found. Please create one."
            exit 1
        fi
        ;;
    "production")
        print_status "Using production environment variables from system"
        # In production, environment variables should be set in the deployment system
        ;;
esac

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not set. Please configure your database connection."
    exit 1
fi

print_status "Database URL configured: ${DATABASE_URL%:*}:***@${DATABASE_URL#*@}"

# Create backup for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Creating database backup before migration..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Extract database connection details for backup
    # This is a simplified backup - in production you'd want more robust backup strategy
    print_warning "Backup creation skipped in this script - implement proper backup strategy for production"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate || { print_error "Failed to generate Prisma client"; exit 1; }

# Run migrations based on environment
if [[ "$ENVIRONMENT" == "development" ]]; then
    print_status "Running development migrations with prisma migrate dev..."
    if [ -n "$MIGRATION_NAME" ]; then
        npx prisma migrate dev --name "$MIGRATION_NAME" || { print_error "Migration failed"; exit 1; }
    else
        npx prisma migrate dev || { print_error "Migration failed"; exit 1; }
    fi
else
    print_status "Running production migrations with prisma migrate deploy..."
    npx prisma migrate deploy || { print_error "Migration failed"; exit 1; }
fi

# Verify migration
print_status "Verifying database connection and schema..."
npx prisma db pull --print || { print_error "Failed to verify database schema"; exit 1; }

print_success "Database migration completed successfully for $ENVIRONMENT! 🎉"

# Optional: Show migration status
print_status "Current migration status:"
npx prisma migrate status || print_warning "Could not retrieve migration status"

print_success "Migration process completed! 🎉"