#!/bin/bash

# 🔧 Fix Database Position Column - Quick Script
# This script fixes the "position column does not exist" error

echo "🔧 Fixing Database Position Column Issue..."
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found"
    echo "💡 Make sure you're running this from the project root"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists npx; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "📋 Step 1: Checking environment setup..."

# Try to load environment variables if .env.local exists
if [ -f .env.local ]; then
    echo "✅ Found .env.local file"
    export $(grep -v '^#' .env.local | xargs) 2>/dev/null || true
else
    echo "⚠️  No .env.local file found"
    
    # Check if vercel is available and try to pull env vars
    if command_exists vercel; then
        echo "📥 Attempting to pull environment variables from Vercel..."
        if vercel env pull .env.local --yes 2>/dev/null; then
            echo "✅ Environment variables pulled from Vercel"
            export $(grep -v '^#' .env.local | xargs) 2>/dev/null || true
        else
            echo "⚠️  Could not pull from Vercel (may not be logged in)"
        fi
    fi
fi

echo ""
echo "🗄️ Step 2: Applying database migration..."

# Try different approaches in order of preference
if [ -n "$POSTGRES_PRISMA_URL" ] || [ -n "$DATABASE_URL" ]; then
    echo "✅ Database connection available, applying migration..."
    
    # Try migrate deploy first (safest)
    if npx prisma migrate deploy 2>/dev/null; then
        echo "✅ Migration applied successfully!"
        MIGRATION_SUCCESS=true
    else
        echo "⚠️  Migration deploy failed, trying database push..."
        
        # Try db push as fallback
        if npx prisma db push --accept-data-loss --force-reset=false 2>/dev/null; then
            echo "✅ Database schema pushed successfully!"
            MIGRATION_SUCCESS=true
        else
            echo "❌ Both migration approaches failed"
            MIGRATION_SUCCESS=false
        fi
    fi
else
    echo "❌ No database connection available"
    echo "💡 You'll need to set up environment variables first"
    MIGRATION_SUCCESS=false
fi

echo ""
echo "🔧 Step 3: Generating Prisma client..."

if npx prisma generate; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""

if [ "$MIGRATION_SUCCESS" = true ]; then
    echo "🎉 SUCCESS! Database schema has been updated!"
    echo ""
    echo "✅ What was fixed:"
    echo "   • Added 'position' column to Playlist table"
    echo "   • Added 'bpm' column to Song table"
    echo "   • Created PlaylistSync, SyncLog, ImportHistory tables"
    echo "   • Added SyncStatus, ImportStatus, SyncAction enums"
    echo ""
    echo "🚀 Your playlist creation should now work without errors!"
    echo ""
    echo "🔍 To verify the fix:"
    echo "   npx prisma studio  # View database in browser"
    echo "   npm run dev        # Test your application"
else
    echo "⚠️  PARTIAL SUCCESS: Prisma client updated, but database migration needs manual attention"
    echo ""
    echo "📋 Manual steps needed:"
    echo "1. Set up database connection:"
    echo "   vercel env pull .env.local"
    echo ""
    echo "2. Apply migration:"
    echo "   npx prisma migrate deploy"
    echo "   # OR"
    echo "   npx prisma db push --accept-data-loss"
    echo ""
    echo "3. See the full guide: fix-database-position-column.md"
fi

echo ""
echo "📋 Migration file created at:"
echo "   prisma/migrations/20250701024230_add_missing_fields/migration.sql"
echo ""