#!/bin/bash

# Local PostgreSQL Database Setup Script
# This script sets up a local PostgreSQL database for development

set -e

echo "🗄️ Setting up local PostgreSQL database for development..."
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}📦 PostgreSQL not found. Installing...${NC}"
    
    # Detect OS and install PostgreSQL
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo -e "${RED}❌ Homebrew not found. Please install PostgreSQL manually.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported OS. Please install PostgreSQL manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL is available${NC}"

# Database configuration
DB_NAME="music_playlist_manager"
DB_USER="playlist_user"
DB_PASSWORD="dev_password_123"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}🔧 Creating database and user...${NC}"

# Start PostgreSQL service if not running
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo service postgresql start || true
fi

# Create database and user
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${GREEN}✅ Database created successfully${NC}"

# Create connection strings
POSTGRES_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo -e "${BLUE}📝 Updating .env.local file...${NC}"

# Create or update .env.local
cat > .env.local << EOF
# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Local PostgreSQL Database URLs
POSTGRES_URL="$POSTGRES_URL"
POSTGRES_PRISMA_URL="$POSTGRES_URL"
POSTGRES_URL_NON_POOLING="$POSTGRES_URL"

# Spotify API (Get these from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional: For development
NODE_ENV=development
EOF

echo -e "${GREEN}✅ Environment file updated${NC}"

echo -e "${BLUE}🧪 Testing database connection...${NC}"

# Test the database connection
if npm run db:test; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    
    echo -e "${BLUE}📊 Creating database schema...${NC}"
    if npm run db:push; then
        echo -e "${GREEN}✅ Database schema created successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️ Schema creation failed, but connection works${NC}"
    fi
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}💡 Please check the connection manually:${NC}"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

echo ""
echo -e "${GREEN}🎉 Local database setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Database Details:${NC}"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "   1. Run 'npm run dev' to start the application"
echo "   2. Visit http://localhost:3000 to see your app"
echo "   3. Run 'npm run db:studio' to manage your database"
echo ""
echo -e "${YELLOW}📝 Note: This is a development setup only!${NC}"
echo "   For production, use Neon, Vercel Postgres, or another cloud provider."