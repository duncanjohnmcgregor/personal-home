# CI/CD Automation for Vercel Postgres Setup

This guide explains the complete CI/CD automation solution for setting up and deploying Vercel Postgres with your music playlist manager application.

## 🏗️ Architecture Overview

The automation consists of three main components:

1. **GitHub Actions Workflows** - Automated CI/CD pipelines
2. **Setup Scripts** - Standalone automation scripts
3. **Verification Tools** - Health checks and validation

## 📁 Files Created

### GitHub Actions Workflows
- `.github/workflows/vercel-postgres-setup.yml` - Main deployment workflow
- `.github/workflows/database-health-check.yml` - Database monitoring

### Scripts
- `scripts/setup-vercel-postgres.sh` - Standalone setup automation
- `scripts/verify-setup.sh` - Setup verification script
- `scripts/test-db-connection.js` - Database connection testing

### Documentation
- `VERCEL_POSTGRES_SETUP.md` - Manual setup guide
- `DATABASE_SETUP_SOLUTION.md` - Problem resolution summary
- `CI_CD_AUTOMATION_GUIDE.md` - This comprehensive guide

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone your repository
git clone <your-repo-url>
cd music-playlist-manager

# Run automated setup
./scripts/setup-vercel-postgres.sh

# Verify setup
./scripts/verify-setup.sh
```

### Option 2: CI/CD Pipeline

1. **Set up GitHub Secrets** (see below)
2. **Push to main branch** or **manually trigger workflow**
3. **Monitor deployment** in GitHub Actions tab

## 🔐 Required GitHub Secrets

Set these secrets in your GitHub repository settings:

### Essential Secrets
```bash
VERCEL_TOKEN          # Vercel authentication token
VERCEL_ORG_ID        # Your Vercel organization ID
VERCEL_PROJECT_ID    # Your Vercel project ID
```

### Optional Secrets
```bash
SPOTIFY_CLIENT_ID       # Spotify API client ID
SPOTIFY_CLIENT_SECRET   # Spotify API client secret
PRODUCTION_DOMAIN      # Custom production domain
STAGING_DOMAIN         # Custom staging domain
```

### How to Get These Values

#### Vercel Token
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with appropriate scopes
3. Copy the token value

#### Vercel Organization & Project IDs
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get IDs from .vercel/project.json
cat .vercel/project.json
```

## 🔄 CI/CD Workflows

### Main Deployment Workflow

**File:** `.github/workflows/vercel-postgres-setup.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

**Features:**
- ✅ Automatic database creation
- ✅ Environment variable setup
- ✅ Schema migrations
- ✅ Application deployment
- ✅ Health checks
- ✅ Multi-environment support

**Usage:**
```bash
# Automatic trigger
git push origin main

# Manual trigger with custom environment
# Go to GitHub Actions → Select workflow → Run workflow
# Choose environment: staging/production
# Optional: Force database reset
```

### Database Health Check Workflow

**File:** `.github/workflows/database-health-check.yml`

**Triggers:**
- Scheduled (every 6 hours)
- Manual workflow dispatch

**Features:**
- 🏥 Connection health monitoring
- 📊 Performance testing
- 🧹 Automatic maintenance
- 📋 Health reports
- 🔄 Backup verification

## 🖥️ Local Development Scripts

### Setup Script

**File:** `scripts/setup-vercel-postgres.sh`

Complete automation for local or CI/CD environments:

```bash
# Basic usage
./scripts/setup-vercel-postgres.sh

# Production environment
./scripts/setup-vercel-postgres.sh production

# Force database reset
./scripts/setup-vercel-postgres.sh staging true

# With environment variables
SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret \
./scripts/setup-vercel-postgres.sh production
```

### Verification Script

**File:** `scripts/verify-setup.sh`

Comprehensive setup validation:

```bash
# Run verification
./scripts/verify-setup.sh

# Check generated report
cat VERIFICATION_REPORT.md
```

## 🏷️ Environment Variables

### Required for All Environments

```bash
# Database (automatically set by Vercel Postgres)
POSTGRES_URL="postgresql://user:pass@host:5432/db"
POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host:5432/db"

# Authentication (automatically generated)
NEXTAUTH_SECRET="generated-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"
```

### Optional API Keys

```bash
# Spotify Integration
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Other music services
BEATPORT_CLIENT_ID="your-beatport-client-id"
SOUNDCLOUD_CLIENT_ID="your-soundcloud-client-id"
```

## 🎯 Deployment Environments

### Staging Environment
- **Branch:** `develop`, `staging`, or manual trigger
- **URL:** `https://music-playlist-manager-staging.vercel.app`
- **Database:** `music-playlist-db-staging`
- **Purpose:** Testing and development

### Production Environment
- **Branch:** `main` or manual trigger with production flag
- **URL:** `https://music-playlist-manager.vercel.app`
- **Database:** `music-playlist-db-production`
- **Purpose:** Live application

## 🔍 Monitoring & Health Checks

### Automated Health Checks

The system includes comprehensive health monitoring:

1. **Connection Tests** - Database connectivity
2. **Performance Tests** - Query response times
3. **Data Integrity** - Orphaned record detection
4. **Table Health** - Schema validation
5. **Backup Status** - Backup verification

### Manual Health Checks

```bash
# Test database connection
npm run db:test

# Open database admin interface
npm run db:studio

# Run migrations
npm run db:migrate

# Verify deployment
curl https://your-app.vercel.app
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check environment variables
./scripts/verify-setup.sh

# Re-pull environment variables
vercel env pull .env.local

# Test connection
npm run db:test
```

#### 2. Prisma Client Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database schema
npm run db:push --force-reset
```

#### 3. Deployment Failed
```bash
# Check Vercel authentication
vercel whoami

# Re-link project
vercel link

# Deploy manually
vercel --prod
```

#### 4. CI/CD Pipeline Failed
- Check GitHub secrets are set correctly
- Verify VERCEL_TOKEN has appropriate permissions
- Review GitHub Actions logs for specific errors

### Debug Commands

```bash
# Check Vercel project status
vercel ls

# View environment variables
vercel env ls

# Check database storage
vercel storage ls

# View deployment logs
vercel logs <deployment-url>
```

## 🔧 Customization

### Custom Domains

Set custom domains in GitHub secrets:
```bash
PRODUCTION_DOMAIN="music.yourdomain.com"
STAGING_DOMAIN="staging-music.yourdomain.com"
```

### Custom Database Regions

Edit `scripts/setup-vercel-postgres.sh`:
```bash
# Change default region
local region="eu-west-1"  # or your preferred region
```

### Additional Environment Variables

Add to the setup script or workflow files:
```bash
# Example: Add Redis URL
if [ -n "$REDIS_URL" ]; then
    echo "$REDIS_URL" | vercel env add REDIS_URL production --force
fi
```

## 📊 Best Practices

### Security
- ✅ Use GitHub secrets for sensitive data
- ✅ Rotate Vercel tokens regularly
- ✅ Limit token permissions to minimum required
- ✅ Use environment-specific databases

### Performance
- ✅ Use connection pooling (POSTGRES_PRISMA_URL)
- ✅ Use direct connections only for migrations
- ✅ Monitor query performance
- ✅ Regular database maintenance

### DevOps
- ✅ Automate everything possible
- ✅ Include comprehensive health checks
- ✅ Generate detailed reports
- ✅ Use staging environments for testing

## 📚 Additional Resources

### Documentation
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/postgres)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Support
- [Vercel Discord](https://vercel.com/discord)
- [Prisma Slack](https://slack.prisma.io/)
- [GitHub Community](https://github.com/community)

---

🎉 **Your Vercel Postgres setup is now fully automated!** 

Simply push your code, and the CI/CD pipeline will handle database creation, migrations, environment setup, and deployment automatically.