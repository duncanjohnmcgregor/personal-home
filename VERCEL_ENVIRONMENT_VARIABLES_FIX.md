# 🔧 Vercel Environment Variables Fix

## 🚨 Problem
Your Vercel deployment is failing with this error:
```
error: Environment variable not found: POSTGRES_PRISMA_URL.
```

This happens because the required database environment variables are not configured in your Vercel project.

## ✅ Solution

### Option 1: Use Vercel CLI (Recommended)

```bash
# 1. Make sure you're logged in to Vercel
vercel login

# 2. Link your project (if not already linked)
vercel link

# 3. Create a Postgres database (if you don't have one)
vercel storage create postgres

# 4. Add environment variables to Vercel
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET

# 5. Pull the environment variables to your local .env.local
vercel env pull .env.local

# 6. Redeploy your application
vercel --prod
```

### Option 2: Use Vercel Dashboard

1. **Go to your Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Settings → Environment Variables**

3. **Add the following environment variables:**

   | Variable Name | Value | Environment |
   |---------------|-------|-------------|
   | `POSTGRES_PRISMA_URL` | Your Neon pooled connection string | Production, Preview, Development |
   | `POSTGRES_URL_NON_POOLING` | Your Neon direct connection string | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | A random 32-character string | Production, Preview, Development |
   | `NEXTAUTH_URL` | Your deployed URL (e.g., https://your-app.vercel.app) | Production, Preview |
   | `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | Production, Preview, Development |
   | `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | Production, Preview, Development |

4. **Redeploy your application**
   - Go to the Deployments tab
   - Click "Redeploy" on your latest deployment

### Option 3: If You Don't Have a Database Yet

If you haven't set up your database yet, here's the complete process:

```bash
# 1. Create Vercel Postgres database
vercel storage create postgres

# 2. This will automatically add these environment variables to your Vercel project:
# - POSTGRES_URL
# - POSTGRES_PRISMA_URL  
# - POSTGRES_URL_NON_POOLING

# 3. Add the remaining environment variables
vercel env add NEXTAUTH_SECRET
# Enter a random 32-character string when prompted

vercel env add NEXTAUTH_URL
# Enter your deployed URL (e.g., https://your-app.vercel.app)

vercel env add SPOTIFY_CLIENT_ID
# Enter your Spotify app client ID

vercel env add SPOTIFY_CLIENT_SECRET
# Enter your Spotify app client secret

# 4. Pull environment variables locally
vercel env pull .env.local

# 5. Initialize your database
npm run db:generate
npm run db:push

# 6. Deploy
vercel --prod
```

## 🔍 How to Get Your Database Connection Strings

### If Using Vercel Postgres:
```bash
# Get your connection strings
vercel storage ls
vercel storage inspect <database-name>
```

### If Using Neon:
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click "Connect"
4. Copy the connection strings:
   - **Pooled connection** → `POSTGRES_PRISMA_URL`
   - **Direct connection** → `POSTGRES_URL_NON_POOLING`

## 🔐 How to Generate NEXTAUTH_SECRET

```bash
# Generate a secure random string
openssl rand -base64 32
```

Or use this Node.js command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🎯 Environment Variable Examples

Here's what your environment variables should look like:

```bash
# Database (Vercel Postgres example)
POSTGRES_PRISMA_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://username:password@host:5432/database"

# Authentication
NEXTAUTH_SECRET="your-32-character-random-string"
NEXTAUTH_URL="https://your-app.vercel.app"

# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
```

## 🚀 Verification Steps

After adding the environment variables:

1. **Check Environment Variables in Vercel Dashboard**
   - Go to Settings → Environment Variables
   - Verify all required variables are present

2. **Test Locally**
   ```bash
   # Pull latest environment variables
   vercel env pull .env.local
   
   # Test database connection
   npm run db:test
   
   # Start development server
   npm run dev
   ```

3. **Deploy and Test**
   ```bash
   # Deploy to production
   vercel --prod
   
   # Test your deployed application
   curl https://your-app.vercel.app/api/health
   ```

## 🔧 Common Issues and Solutions

### Issue: "NEXTAUTH_URL mismatch"
**Solution**: Make sure `NEXTAUTH_URL` matches your actual deployed URL exactly.

### Issue: "Database connection timeout"
**Solution**: 
- Check your database is running
- Verify connection strings are correct
- Try using the direct connection string for debugging

### Issue: "Invalid Spotify credentials"
**Solution**: 
- Verify your Spotify app redirect URI includes your deployed URL
- Check Client ID and Secret are correct

### Issue: Environment variables not updating
**Solution**:
- Redeploy your application after adding environment variables
- Clear Vercel's cache: `vercel --prod --force`

## 📋 Quick Checklist

- [ ] Database created (Vercel Postgres or Neon)
- [ ] `POSTGRES_PRISMA_URL` added to Vercel
- [ ] `POSTGRES_URL_NON_POOLING` added to Vercel
- [ ] `NEXTAUTH_SECRET` generated and added
- [ ] `NEXTAUTH_URL` set to deployed URL
- [ ] Spotify credentials added
- [ ] Application redeployed
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Application tested

## 🎉 Success Indicators

You'll know it's working when:
- ✅ No more "Environment variable not found" errors
- ✅ Users can sign in with Spotify
- ✅ Database operations work correctly
- ✅ Application loads without errors

---

**Need immediate help?** Run this command to see your current environment variables:
```bash
vercel env ls
```

This will show you which variables are missing from your Vercel project.