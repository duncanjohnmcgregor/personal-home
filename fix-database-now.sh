#!/bin/bash

# 🚀 Fix Database Tables - Run This Script!
# This script will create all missing database tables

echo "🗄️ Fixing Database Tables..."
echo "=================================="
echo ""

# Step 1: Pull environment variables
echo "📥 Step 1: Pulling environment variables from Vercel..."
if vercel env pull .env.local; then
    echo "✅ Environment variables pulled successfully!"
else
    echo "❌ Failed to pull environment variables"
    echo "💡 Make sure you're logged in: vercel login"
    exit 1
fi

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
    echo "⚠️ Migration failed, trying alternative approach..."
    if npx prisma db push; then
        echo "✅ Database schema pushed successfully!"
    else
        echo "❌ Both approaches failed. Please check your database connection."
        exit 1
    fi
fi

echo ""

# Step 4: Deploy application
echo "🚀 Step 4: Deploying application..."
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