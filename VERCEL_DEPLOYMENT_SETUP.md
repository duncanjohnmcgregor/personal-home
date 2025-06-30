# Vercel Deployment Setup Guide

## 🚀 Overview
This guide will help you set up automatic deployment to Vercel when code is merged to the `main` branch.

## ✅ Fixed Issues
- ✅ Added missing `healthcheck.js` file
- ✅ Configured Next.js for standalone output
- ✅ Updated Dockerfile for proper health checks
- ✅ Configured GitHub Actions for automatic deployment

## 📋 Prerequisites

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Install the Vercel GitHub App on your repository

### 2. Create Vercel Project
1. In Vercel dashboard, click "New Project"
2. Import your GitHub repository
3. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npx prisma generate && npm run build`
   - **Install Command**: `npm ci`
   - **Output Directory**: Leave empty (uses default `.next`)

## 🔑 Required Secrets

### GitHub Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Vercel Integration Secrets
```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_PROJECT_NAME=your_project_name_here
```

### How to Get Vercel Secrets

#### 1. Get Vercel Token
```bash
# Install Vercel CLI
npm install -g vercel

# Login and get token
vercel login
vercel tokens create
```

#### 2. Get Organization ID
```bash
# In your project directory
vercel link
cat .vercel/project.json
```

#### 3. Get Project ID
From the same `.vercel/project.json` file or Vercel dashboard → Project Settings

## 🌍 Environment Variables

### Vercel Dashboard Configuration
Go to your Vercel project → Settings → Environment Variables

Add these variables for **Production**:

#### Required Variables
```bash
# Authentication
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=your_secure_random_secret_key_here

# Database (Use a managed service like Supabase, Neon, or Railway)
DATABASE_URL=postgresql://username:password@host:5432/database

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Node Environment
NODE_ENV=production
```

#### Optional Variables (for enhanced features)
```bash
# Redis (for caching) - Use Upstash or similar
REDIS_URL=redis://host:6379
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Monitoring
SENTRY_DSN=your_sentry_dsn
VERCEL_ANALYTICS_ID=your_analytics_id

# Additional API keys
BEATPORT_CLIENT_ID=your_beatport_client_id
BEATPORT_CLIENT_SECRET=your_beatport_client_secret
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
```

## 📁 Database Setup

### Recommended: Managed PostgreSQL
Choose one of these managed database services:

#### Option 1: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Add to `DATABASE_URL` in Vercel

#### Option 2: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string
4. Add to `DATABASE_URL` in Vercel

#### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Deploy PostgreSQL service
3. Get connection string
4. Add to `DATABASE_URL` in Vercel

### Database Migration
Your database will be automatically migrated during deployment via:
```bash
npx prisma generate  # Generates client
npx prisma db push   # Pushes schema (for development)
```

For production, use:
```bash
npx prisma migrate deploy  # Deploys migrations
```

## 🎵 Spotify API Setup

### 1. Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create new app
3. Set redirect URIs:
   - `http://localhost:3000/api/auth/callback/spotify` (development)
   - `https://your-project-name.vercel.app/api/auth/callback/spotify` (production)

### 2. Get Credentials
- Copy Client ID and Client Secret to Vercel environment variables

## 🔄 Deployment Workflow

### Automatic Deployment
When code is pushed to `main` branch:

1. **CI Checks Run** (from `.github/workflows/ci.yml`)
   - Install dependencies
   - Generate Prisma client
   - Type checking
   - Linting
   - Build test

2. **Production Deployment** (from `.github/workflows/deploy-production.yml`)
   - Install dependencies
   - Generate Prisma client
   - Run tests and checks
   - Deploy to Vercel
   - Health check
   - Notification

### Manual Deployment
You can also trigger manual deployment:
1. Go to GitHub repository → Actions
2. Select "Deploy to Production"
3. Click "Run workflow"

## 🧪 Testing the Setup

### 1. Test Local Build
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Test build
npm run build

# Test type checking
npm run type-check
```

### 2. Test Deployment
1. Push a small change to `main` branch
2. Check GitHub Actions tab for deployment status
3. Verify health endpoint: `https://your-project-name.vercel.app/api/health`

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails on Vercel
- Check environment variables are set correctly
- Ensure `DATABASE_URL` is accessible from Vercel
- Check build logs in Vercel dashboard

#### 2. Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure database allows connections from Vercel IPs
- Check if database service is running

#### 3. Authentication Issues
- Verify `NEXTAUTH_URL` matches your Vercel URL
- Ensure `NEXTAUTH_SECRET` is set and secure
- Check Spotify redirect URIs

#### 4. GitHub Actions Failing
- Verify all required secrets are set in GitHub
- Check that Vercel project exists and is linked
- Ensure token has proper permissions

### Debug Commands
```bash
# Check Vercel project status
vercel status

# View deployment logs
vercel logs

# Test health endpoint
curl https://your-project-name.vercel.app/api/health
```

## 🎉 Success!

Once setup is complete, your deployment workflow will:
- ✅ Automatically deploy when code is merged to `main`
- ✅ Run health checks after deployment
- ✅ Provide deployment status notifications
- ✅ Support manual deployments when needed

Your app will be available at: `https://your-project-name.vercel.app`

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deploying-to-vercel)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)