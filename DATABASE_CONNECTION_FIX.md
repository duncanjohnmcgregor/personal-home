# Database Connection Fix for CD Pipeline

## Issue Description

The database health check is failing during the CD pipeline build with this error:

```
🔍 Step 2: Testing database connection...
❌ Database connection failed
Please verify your database connection strings
```

## Root Cause

**Environment Variable Mismatch**: The Prisma schema is configured to use `POSTGRES_PRISMA_URL`, but this environment variable is missing from the Vercel project configuration.

### Current Prisma Schema Configuration
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL") // ❌ Missing in Vercel
  directUrl = env("POSTGRES_URL_NON_POOLING") // ✅ Available in Vercel
}
```

### Current Vercel Environment Variables
From your Vercel dashboard screenshot:
- ✅ `POSTGRES_URL_NON_POOLING` - Available
- ❌ `POSTGRES_PRISMA_URL` - **Missing**
- ✅ `POSTGRES_URL` - Available (but not used by schema)
- ✅ `DATABASE_URL` - Available (but not used by schema)

## Solution Options

### Option 1: Add Missing Environment Variable (Recommended)

Add `POSTGRES_PRISMA_URL` to your Vercel environment variables:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add new environment variable:**
   - **Name**: `POSTGRES_PRISMA_URL`
   - **Value**: Use the same value as your `POSTGRES_URL` (the connection pooling URL)
   - **Environments**: Production, Preview, Development

The `POSTGRES_PRISMA_URL` should typically be your **connection pooling URL** from Neon, which usually looks like:
```
postgresql://username:password@host/database?pgbouncer=true&connection_limit=1
```

### Option 2: Update Prisma Schema to Use Existing Variables

Alternatively, you could update your Prisma schema to use the existing environment variables:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_URL") // Use existing variable
  directUrl = env("POSTGRES_URL_NON_POOLING") // Already correct
}
```

## Recommended Action

**Choose Option 1** - Add the missing `POSTGRES_PRISMA_URL` environment variable to Vercel, because:

1. Your GitHub Actions workflows are already configured to expect `POSTGRES_PRISMA_URL`
2. The naming convention clearly distinguishes between pooled and non-pooled connections
3. It maintains consistency with your existing workflow configuration

## Implementation Steps

### Step 1: Get Your Neon Connection URLs

From your Neon dashboard, you should have two URLs:
- **Connection pooling URL** (for `POSTGRES_PRISMA_URL`)
- **Direct connection URL** (for `POSTGRES_URL_NON_POOLING`)

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   ```
   Name: POSTGRES_PRISMA_URL
   Value: [Your connection pooling URL from Neon]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

### Step 3: Verify Configuration

After adding the environment variable, your Vercel environment should have:

- ✅ `POSTGRES_PRISMA_URL` - Connection pooling URL
- ✅ `POSTGRES_URL_NON_POOLING` - Direct connection URL  
- ✅ `NEXTAUTH_SECRET` - Authentication secret
- ✅ `NEXTAUTH_URL` - Authentication callback URL
- ✅ `SPOTIFY_CLIENT_ID` - Spotify app client ID
- ✅ `SPOTIFY_CLIENT_SECRET` - Spotify app client secret

### Step 4: Trigger New Deployment

1. Make a small commit to trigger the CD pipeline
2. Or manually trigger deployment from Vercel dashboard
3. The database health check should now pass

## Expected Results

After the fix, you should see:

```
🔍 Step 2: Testing database connection...
✅ Database connection successful
```

Instead of the current error.

## Testing the Fix

You can test the environment variable configuration by:

1. **Local Testing**: Set the environment variables locally and run:
   ```bash
   npx prisma generate
   npx prisma db execute --stdin <<< "SELECT 1 as connection_test;"
   ```

2. **Vercel Testing**: After deployment, the post-deployment health check will verify the connection.

## Prevention

To prevent similar issues in the future:

1. **Document Required Environment Variables**: Keep a list of all required environment variables
2. **Environment Variable Validation**: Consider adding validation scripts that check for required variables
3. **Consistent Naming**: Use consistent naming conventions across all environments (local, staging, production)

## Related Files

- `prisma/schema.prisma` - Database configuration
- `.github/workflows/deploy-production.yml` - CD pipeline configuration
- `vercel.json` - Vercel deployment configuration

## Next Steps

1. ✅ Add `POSTGRES_PRISMA_URL` to Vercel environment variables
2. ✅ Trigger new deployment  
3. ✅ Verify database health check passes
4. ✅ Test application functionality in production