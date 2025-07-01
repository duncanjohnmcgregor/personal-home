# Database Schema Deployment Guide

## Overview

The GitHub Actions deployment workflow now includes comprehensive database schema setup and validation. This ensures that every deployment includes the latest database changes and maintains data integrity.

## 🔄 Automated Database Deployment Process

### What Happens During Deployment

1. **Environment Validation**: Checks that all required database secrets are configured
2. **Schema Setup**: Deploys the latest database schema using Prisma migrations
3. **Connection Testing**: Verifies database connectivity before proceeding
4. **Schema Verification**: Confirms all tables and relationships are properly created
5. **Post-Deployment Health Check**: Tests database performance after deployment

### Required GitHub Secrets

The deployment workflow requires these secrets to be configured in your GitHub repository:

```bash
# Database Connection (Required)
POSTGRES_PRISMA_URL          # Connection pooling URL for app queries
POSTGRES_URL_NON_POOLING     # Direct connection URL for migrations

# Authentication (Required)
NEXTAUTH_SECRET              # Random secret for NextAuth.js

# Deployment (Required)
VERCEL_TOKEN                 # Vercel deployment token
```

## 📋 Database Schema

The deployment process sets up the following database structure:

### Core Authentication Tables
- **User**: User profiles and authentication data
- **Account**: OAuth provider accounts (Spotify, etc.)
- **Session**: User session management
- **VerificationToken**: Email verification tokens

### Playlist Management Tables
- **Playlist**: User playlists with metadata
- **Song**: Song information and metadata
- **PlaylistSong**: Many-to-many relationship between playlists and songs

### Advanced Features Tables
- **PurchaseHistory**: Track music purchases from different platforms
- **PlaylistSync**: Synchronization status with external platforms
- **SyncLog**: Detailed sync operation logs
- **ImportHistory**: Track playlist import operations

## 🚀 Deployment Workflow Steps

### 1. Pre-Deployment Validation

```yaml
- name: Validate Database Environment Variables
  # Ensures all required database secrets are configured
  # Fails fast if any required secrets are missing
```

### 2. Database Schema Setup

```yaml
- name: Setup Database Schema
  # Step 1: Generate Prisma client
  # Step 2: Test database connection
  # Step 3: Check migration status
  # Step 4: Deploy migrations or push schema
  # Step 5: Verify all tables are accessible
```

### 3. Application Deployment

```yaml
# Standard Vercel deployment process
# Now runs after database schema is confirmed ready
```

### 4. Post-Deployment Health Check

```yaml
- name: Post-Deployment Database Health Check
  # Tests database connectivity after deployment
  # Verifies table accessibility and query performance
  # Provides early warning of any issues
```

## 🛠️ Setting Up Database Secrets

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the required database variables
4. Use Vercel CLI to pull secrets to GitHub:

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Pull environment variables
vercel env pull .env.local

# Add secrets to GitHub from your .env.local file
```

### Option 2: Manual GitHub Secrets Setup

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add each required secret:

```bash
# Example values (replace with your actual values)
POSTGRES_PRISMA_URL: "postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING: "postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET: "your-random-secret-key"
VERCEL_TOKEN: "your-vercel-token"
```

## 🔍 Database Migration Strategy

### Development Workflow

1. **Make Schema Changes**: Edit `prisma/schema.prisma`
2. **Create Migration**: Run `npx prisma migrate dev --name descriptive-name`
3. **Test Locally**: Verify changes work with `npm run db:test`
4. **Commit Changes**: Include both schema and migration files
5. **Push to Main**: Triggers automatic deployment with schema updates

### Production Deployment

The GitHub Actions workflow automatically:

1. **Validates Schema**: Ensures schema is syntactically correct
2. **Deploys Migrations**: Uses `prisma migrate deploy` for production
3. **Fallback Strategy**: Uses `prisma db push` if migrations fail
4. **Verifies Success**: Tests all tables are accessible

## 🧪 Testing Database Changes

### Local Testing

```bash
# Test database connection
npm run db:test

# Generate Prisma client
npm run db:generate

# Apply migrations locally
npm run db:migrate

# View database in browser
npm run db:studio
```

### CI/CD Testing

The CI workflow now includes:

- **Schema Validation**: Syntax and structure validation
- **Type Generation**: Ensures TypeScript types are valid
- **Migration Analysis**: Checks for potentially destructive operations
- **Build Integration**: Verifies schema works with application build

## 🚨 Troubleshooting

### Common Issues

**"POSTGRES_PRISMA_URL secret is not set"**
- Add the required database secrets to GitHub repository settings
- Ensure secrets are named exactly as shown in the guide

**"Database connection failed"**
- Verify your database connection strings are correct
- Check that your database allows connections from GitHub Actions IP ranges
- Ensure database is running and accessible

**"Migration deploy failed"**
- Check migration files for syntax errors
- Verify database permissions allow schema modifications
- Review migration conflicts in the logs

**"Schema verification failed"**
- Database might be partially created
- Check database logs for detailed error information
- Verify all required tables were created successfully

### Debug Commands

```bash
# Check deployment logs
vercel logs

# Test database connection locally
npm run db:test

# Validate schema syntax
npx prisma validate

# Check migration status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

## 📊 Monitoring Database Health

### Automated Monitoring

The deployment includes automated health checks that monitor:

- **Connection Performance**: Query response times
- **Table Accessibility**: All tables can be queried
- **Data Integrity**: No orphaned records or broken relationships
- **Index Performance**: Query optimization status

### Manual Monitoring

```bash
# View database in browser
npx prisma studio

# Check database performance
npm run health-check

# Run comprehensive database health check
npm run db:verify
```

## 🔄 Rollback Strategy

### If Deployment Fails

1. **Check Logs**: Review GitHub Actions logs for specific errors
2. **Verify Secrets**: Ensure all required secrets are correctly configured
3. **Test Locally**: Reproduce the issue in your local environment
4. **Fix and Redeploy**: Make necessary fixes and push to trigger new deployment

### If Database Issues Occur

1. **Immediate Rollback**: Revert to previous working commit
2. **Database Recovery**: Use database provider's backup/restore features
3. **Migration Repair**: Fix migration issues and redeploy
4. **Data Recovery**: Restore any lost data from backups

## 📈 Best Practices

### Schema Changes

- **Test Locally First**: Always test schema changes in development
- **Use Descriptive Migration Names**: Help future developers understand changes
- **Review Migration SQL**: Check generated SQL before deploying
- **Backup Before Major Changes**: Ensure you can recover if needed

### Deployment Safety

- **Monitor Deployments**: Watch GitHub Actions logs during deployment
- **Test After Deployment**: Verify application works correctly after deployment
- **Keep Migrations Small**: Make incremental changes rather than large overhauls
- **Document Changes**: Update this guide when making process improvements

## 🎯 Next Steps

After setting up the database deployment process:

1. **Configure Secrets**: Add all required secrets to GitHub repository
2. **Test Deployment**: Make a small change and verify deployment works
3. **Monitor Performance**: Keep an eye on database performance metrics
4. **Plan Maintenance**: Schedule regular database maintenance and backups

---

**Need Help?** Check the troubleshooting section above or review the GitHub Actions logs for detailed error information.