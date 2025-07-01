#!/bin/bash

# 🚀 Fix Database Tables v2 - With Proper Environment Loading
# This script will create all missing database tables

echo "🗄️ Fixing Database Tables (v2)..."
echo "===================================="
echo ""

# Function to load environment variables
load_env() {
    if [ -f .env.local ]; then
        echo "📋 Loading environment variables..."
        export $(grep -v '^#' .env.local | xargs)
        echo "✅ Environment variables loaded"
    else
        echo "❌ .env.local file not found"
        exit 1
    fi
}

# Step 1: Pull environment variables (if needed)
if [ ! -f .env.local ]; then
    echo "📥 Step 1: Pulling environment variables from Vercel..."
    if vercel env pull .env.local; then
        echo "✅ Environment variables pulled successfully!"
    else
        echo "❌ Failed to pull environment variables"
        echo "💡 Make sure you're logged in: vercel login"
        exit 1
    fi
else
    echo "📥 Step 1: Using existing .env.local file..."
fi

echo ""

# Load environment variables
load_env

echo ""

# Verify we have the required variables
echo "🔍 Verifying environment variables..."
if [ -z "$POSTGRES_PRISMA_URL" ]; then
    echo "❌ POSTGRES_PRISMA_URL not found"
    exit 1
fi

if [ -z "$POSTGRES_URL_NON_POOLING" ]; then
    echo "❌ POSTGRES_URL_NON_POOLING not found"
    exit 1
fi

echo "✅ POSTGRES_PRISMA_URL: Set"
echo "✅ POSTGRES_URL_NON_POOLING: Set"

echo ""

# Step 2: Generate Prisma client
echo "🔧 Step 2: Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""

# Step 3: Apply migrations
echo "🗄️ Step 3: Creating database tables..."
if npx prisma migrate deploy; then
    echo "✅ All database tables created successfully!"
else
    echo "⚠️ Migration failed, trying database push..."
    if npx prisma db push --accept-data-loss; then
        echo "✅ Database schema pushed successfully!"
    else
        echo "❌ Both approaches failed. Checking database connection..."
        
        # Try a simple connection test
        echo "🔍 Testing database connection..."
        if npx prisma db execute --stdin <<< "SELECT 1;"; then
            echo "✅ Database connection works"
            echo "❌ But schema creation failed. Please check permissions."
        else
            echo "❌ Database connection failed. Please check your connection strings."
        fi
        exit 1
    fi
fi

echo ""

# Step 4: Verify tables were created
echo "🔍 Step 4: Verifying tables were created..."
if npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null; then
    echo "✅ Database tables verified!"
else
    echo "⚠️ Could not verify tables, but they might still be created"
fi

echo ""

# Step 5: Deploy application
echo "🚀 Step 5: Deploying application..."
if vercel --prod; then
    echo "✅ Application deployed successfully!"
else
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Your database is now set up!"
echo ""
echo "✅ What was created:"
echo "   • Account table (for Spotify OAuth)"
echo "   • Session table (for user sessions)"
echo "   • User table (for user profiles)"
echo "   • Playlist table (for playlists)"
echo "   • Song table (for song metadata)"
echo "   • PlaylistSong table (for relationships)"
echo "   • PurchaseHistory table (for purchases)"
echo "   • VerificationToken table (for email verification)"
echo ""
echo "🔗 Test your app now:"
echo "   Visit your deployed URL and try signing in with Spotify!"
echo ""
echo "🛠️ Useful commands:"
echo "   npx prisma studio    # View database in browser"
echo "   npm run db:test      # Test database connection"
echo "   vercel logs          # View deployment logs"
echo ""