# Database Connection Issue - Root Cause Analysis

## Issue Summary

The CD pipeline is failing during the database health check with this error:
```
🔍 Step 2: Testing database connection...
❌ Database connection failed
Please verify your database connection strings
Error: Process completed with exit code 1.
```

## Root Cause Analysis

### The Real Issue

The problem is **NOT** missing environment variables in Vercel. You correctly have:
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL` 
- ✅ `POSTGRES_URL_NON_POOLING`
- ✅ `DATABASE_URL`

The failure is happening in the **GitHub Actions workflow**, which uses **GitHub Secrets**, not Vercel environment variables.

### Where the Failure Occurs

The error happens in `.github/workflows/deploy-production.yml` at this step:

```yaml
- name: Setup Database Schema
  env:
    POSTGRES_PRISMA_URL: ${{ secrets.POSTGRES_PRISMA_URL }}    # ← This needs to be set
    POSTGRES_URL_NON_POOLING: ${{ secrets.POSTGRES_URL_NON_POOLING }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  run: |
    # Step 2: Check database connection
    echo "🔍 Step 2: Testing database connection..."
    if npx prisma db execute --stdin <<< "SELECT 1 as connection_test;" 2>/dev/null; then
      echo "✅ Database connection successful"
    else
      echo "❌ Database connection failed"  # ← This is where it fails
      exit 1
    fi
```

## Two Separate Environment Systems

1. **Vercel Environment Variables** - Used when your app runs on Vercel
2. **GitHub Secrets** - Used by GitHub Actions during CI/CD

You have configured #1 but need to also configure #2.

## Solution

### Required GitHub Secrets

You need to add these as **GitHub Secrets** (not just Vercel environment variables):

1. **Go to your GitHub repository**
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Add these Repository Secrets**:

| Secret Name | Value | Source |
|-------------|-------|---------|
| `POSTGRES_PRISMA_URL` | Your Neon pooling connection URL | Same as Vercel env var |
| `POSTGRES_URL_NON_POOLING` | Your Neon direct connection URL | Same as Vercel env var |
| `NEXTAUTH_SECRET` | Your NextAuth secret | Same as Vercel env var |
| `VERCEL_TOKEN` | Your Vercel deployment token | From Vercel account settings |

### How to Get the Values

**For Database URLs:**
1. Go to your Neon dashboard
2. Copy the connection strings
3. Use the **pooling URL** for `POSTGRES_PRISMA_URL`
4. Use the **direct URL** for `POSTGRES_URL_NON_POOLING`

**For Vercel Token:**
1. Go to https://vercel.com/account/tokens
2. Create a new token named "GitHub Actions"
3. Copy the token value

### Verification Steps

After adding the GitHub Secrets:

1. **Verify Secrets are Set**: Go to GitHub repo → Settings → Secrets and variables → Actions
2. **Test the Connection**: Run the diagnostic script:
   ```bash
   node scripts/diagnose-db-issue.js
   ```
3. **Trigger Deployment**: Push a change to main branch or manually trigger the workflow

## Common Issues and Solutions

### Issue 1: Wrong Connection String Format

**Symptom**: Connection timeout or authentication errors

**Solution**: Ensure your connection strings follow this format:
```
# Pooling URL (for POSTGRES_PRISMA_URL)
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/database?pgbouncer=true&connection_limit=1

# Direct URL (for POSTGRES_URL_NON_POOLING)  
postgresql://username:password@ep-xxx.region.aws.neon.tech/database
```

### Issue 2: Database Not Accessible

**Symptom**: "Can't reach database server" errors

**Possible Causes**:
- Database is paused (Neon free tier)
- Network connectivity issues
- Wrong hostname/port

**Solution**: 
- Check Neon dashboard for database status
- Verify connection strings are current
- Test connection manually

### Issue 3: Authentication Failures

**Symptom**: "Authentication failed" errors

**Possible Causes**:
- Wrong username/password
- User permissions issues

**Solution**:
- Double-check credentials in Neon dashboard
- Regenerate connection strings if needed

## Testing the Fix

### Local Testing
```bash
# Run the diagnostic script
node scripts/diagnose-db-issue.js

# Test connection directly
npx prisma db execute --stdin <<< "SELECT 1 as test;"
```

### GitHub Actions Testing
1. Push a small change to trigger the workflow
2. Monitor the "Setup Database Schema" step
3. Look for "✅ Database connection successful"

## Expected Success Output

After fixing the GitHub Secrets, you should see:

```
🗄️ Setting up database schema...
======================================

🔧 Step 1: Generating Prisma client...
✅ Prisma client generated successfully

🔍 Step 2: Testing database connection...
✅ Database connection successful

📋 Step 3: Checking migration status...
✅ Database migrations deployed successfully!
```

## Prevention

To avoid this issue in the future:

1. **Document both environment systems** - Vercel AND GitHub
2. **Use environment variable validation** in workflows
3. **Set up monitoring** for connection failures
4. **Keep secrets in sync** between Vercel and GitHub

## Related Files

- `.github/workflows/deploy-production.yml` - Where the failure occurs
- `prisma/schema.prisma` - Database configuration
- `scripts/diagnose-db-issue.js` - Diagnostic tool (newly created)

## Next Steps

1. ✅ **Add GitHub Secrets** (POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, NEXTAUTH_SECRET)
2. ✅ **Test locally** with the diagnostic script  
3. ✅ **Trigger deployment** to verify the fix
4. ✅ **Monitor workflow** for successful completion

---

**The key insight**: Vercel environment variables ≠ GitHub Secrets. Both need to be configured separately! 🔑