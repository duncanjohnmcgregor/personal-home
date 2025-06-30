# Vercel Postgres Database Setup Guide

## Overview
This guide will help you set up Vercel Postgres for your music playlist manager application.

## 1. Create Vercel Postgres Database

### Option 1: Via Vercel Dashboard
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to the "Storage" tab
4. Click "Create Database"
5. Choose "Postgres" (powered by Neon)
6. Select your preferred region
7. Click "Create"

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database
vercel storage create postgres
```

## 2. Environment Variables

After creating the database, Vercel automatically provides these environment variables:

### Required Environment Variables:
- `POSTGRES_URL` - Direct connection string (for migrations)
- `POSTGRES_PRISMA_URL` - Connection pooled URL (for application queries)
- `POSTGRES_URL_NON_POOLING` - Direct connection without pooling

### Setting Environment Variables Locally:
1. Copy the values from your Vercel project dashboard
2. Update your `.env.local` file:

```env
# Vercel Postgres Database
POSTGRES_URL="postgresql://username:password@host:5432/database"
POSTGRES_PRISMA_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://username:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
```

### Setting Environment Variables in Vercel:
Vercel automatically sets these when you create the database, but you can also set them manually:

```bash
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
```

## 3. Prisma Configuration

Your `prisma/schema.prisma` is already configured for Vercel Postgres:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL") // uses connection pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // uses a direct connection
}
```

## 4. Database Setup Commands

Run these commands to set up your database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

## 5. Testing Database Connection

Create a test script to verify your connection:

```javascript
// test-db.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

Run with: `node test-db.js`

## 6. Troubleshooting

### Common Issues:

1. **Connection Failed**: Verify your environment variables are correctly set
2. **Timeout Errors**: Check your internet connection and Vercel region
3. **Migration Errors**: Use `POSTGRES_URL_NON_POOLING` for migrations
4. **Pool Exhaustion**: Use `POSTGRES_PRISMA_URL` for application queries

### Debugging Commands:

```bash
# Check environment variables
echo $POSTGRES_URL

# Test Prisma connection
npx prisma db push --force-reset

# View database in browser
npx prisma studio
```

## 7. Production Deployment

For production deployments, ensure:

1. Environment variables are set in Vercel dashboard
2. Database migrations are run
3. Connection pooling is properly configured

```bash
# Deploy to Vercel
vercel --prod

# Run migrations in production
vercel env pull .env.production
npx prisma migrate deploy
```

## 8. Best Practices

1. **Use Connection Pooling**: Always use `POSTGRES_PRISMA_URL` for app queries
2. **Direct Connections**: Use `POSTGRES_URL_NON_POOLING` only for migrations
3. **Environment Security**: Never commit real credentials to version control
4. **Backup Strategy**: Vercel Postgres provides automatic backups
5. **Monitoring**: Use Vercel Analytics to monitor database performance

## 9. Alternative Providers

If you prefer other providers, Vercel also supports:
- **Supabase**: Full-featured PostgreSQL with auth and real-time features
- **PlanetScale**: MySQL-compatible serverless database
- **MongoDB Atlas**: NoSQL document database

## Support

- Vercel Postgres Documentation: https://vercel.com/docs/storage/postgres
- Prisma Documentation: https://www.prisma.io/docs
- Vercel Discord: https://vercel.com/discord