# CD Pipeline Debug Guide - "Setup Database Schema" Still Failing

## 🔍 Since GitHub Secrets Are Set Correctly...

If you've already added the correct GitHub secrets but the CD pipeline still fails on "Setup Database Schema", here are the **most likely causes** and how to diagnose them:

## 🚨 **Most Common Issue: Binary Targets**

### Problem
Your Prisma schema is missing the correct binary target for GitHub Actions (Ubuntu environment).

### Current Schema Check
In `prisma/schema.prisma`, you currently have:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "rhel-openssl-3.0.x"]
}
```

### The Issue
GitHub Actions runs on **Ubuntu 22.04** which may need a different OpenSSL version.

### **QUICK FIX** - Update Binary Targets

Try this updated configuration:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
}
```

**Why this change:**
- `debian-openssl-3.0.x` - For newer Ubuntu (22.04) in GitHub Actions
- `rhel-openssl-3.0.x` - For AWS Lambda/Vercel production
- `native` - For local development

## 🔧 **Other Potential Issues**

### 1. **Database URL Format Issues**

Check if your `POSTGRES_PRISMA_URL` has the correct format:

```bash
# Correct format for Neon:
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?pgbouncer=true&connection_limit=1

# NOT this format:
postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?pgbouncer=true
```

**Common mistakes:**
- Missing `-pooler` in the hostname for `POSTGRES_PRISMA_URL`
- Using direct URL for both secrets instead of pooling URL for `POSTGRES_PRISMA_URL`

### 2. **Neon Database Sleep Mode**

If you're using Neon's free tier, the database might be sleeping.

**Check:**
1. Go to your Neon dashboard
2. Look for "Database is sleeping" message
3. Click to wake it up if needed

### 3. **IP Restrictions**

Some database providers restrict IP access.

**GitHub Actions IP ranges** are not fixed, so if you have IP restrictions enabled, this could cause connection failures.

### 4. **SSL/TLS Issues**

Check if you need SSL parameters in your connection string:

```bash
# Try adding SSL parameters:
postgresql://user:pass@host:5432/db?sslmode=require

# Or for Neon specifically:
postgresql://user:pass@host:5432/db?sslmode=require&sslcert=&sslkey=&sslrootcert=
```

## 🐛 **Debugging Steps**

### Step 1: Check Exact Error Message

Look at the GitHub Actions logs for the exact error. Common patterns:

```bash
# Binary target issue:
"Error: Could not find binary for target debian-openssl-1.1.x"

# Connection timeout:
"Error: connect ETIMEDOUT"

# Authentication failure:
"Error: password authentication failed"

# SSL issue:
"Error: no SSL support"
```

### Step 2: Add Debug Output to Workflow

Temporarily add this debug step **before** the database setup:

```yaml
- name: Debug Database Connection
  env:
    POSTGRES_PRISMA_URL: ${{ secrets.POSTGRES_PRISMA_URL }}
    POSTGRES_URL_NON_POOLING: ${{ secrets.POSTGRES_URL_NON_POOLING }}
  run: |
    echo "🔍 Debugging database connection..."
    
    # Check if secrets are actually available (without exposing values)
    if [ -n "$POSTGRES_PRISMA_URL" ]; then
      echo "✅ POSTGRES_PRISMA_URL is set (length: ${#POSTGRES_PRISMA_URL})"
    else
      echo "❌ POSTGRES_PRISMA_URL is empty or not set"
    fi
    
    if [ -n "$POSTGRES_URL_NON_POOLING" ]; then
      echo "✅ POSTGRES_URL_NON_POOLING is set (length: ${#POSTGRES_URL_NON_POOLING})"
    else
      echo "❌ POSTGRES_URL_NON_POOLING is empty or not set"
    fi
    
    # Check Ubuntu version
    echo "Ubuntu version: $(lsb_release -d)"
    
    # Check available Prisma binaries after generation
    echo "Available Prisma engines:"
    ls -la node_modules/.prisma/client/ || echo "Prisma client not generated yet"
```

### Step 3: Test Connection with Verbose Output

Update the connection test to show more details:

```yaml
- name: Setup Database Schema
  env:
    POSTGRES_PRISMA_URL: ${{ secrets.POSTGRES_PRISMA_URL }}
    POSTGRES_URL_NON_POOLING: ${{ secrets.POSTGRES_URL_NON_POOLING }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  run: |
    echo "🗄️ Setting up database schema..."
    
    # Step 1: Generate with verbose output
    echo "🔧 Step 1: Generating Prisma client..."
    npx prisma generate --verbose || exit 1
    
    # Show generated engines
    echo "Generated Prisma engines:"
    ls -la node_modules/.prisma/client/ | grep -E "(query|migration)" || echo "No engines found"
    
    # Step 2: Test connection with detailed error output
    echo "🔍 Step 2: Testing database connection..."
    npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1 as connection_test;" 2>&1 || {
      echo "❌ Database connection failed with detailed error above"
      echo "Trying alternative connection method..."
      
      # Try with different connection approach
      node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect()
          .then(() => console.log('✅ Alternative connection successful'))
          .catch(err => {
            console.log('❌ Alternative connection failed:', err.message);
            process.exit(1);
          })
          .finally(() => prisma.\$disconnect());
      " || exit 1
    }
```

## 🎯 **Quick Resolution Checklist**

1. **[ ] Update Binary Targets** (most likely fix):
   ```prisma
   binaryTargets = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
   ```

2. **[ ] Verify Connection String Format**:
   - `POSTGRES_PRISMA_URL` should have `-pooler` in hostname
   - Should end with `?pgbouncer=true&connection_limit=1`

3. **[ ] Check Neon Database Status**:
   - Wake up database if sleeping
   - Verify it's not paused

4. **[ ] Add Debug Output**:
   - Use the debug step above to see exact error

5. **[ ] Test Secret Values**:
   - Ensure they match exactly what works in Vercel
   - No extra spaces or hidden characters

## 🚀 **Expected Fix**

Most likely, updating the binary targets will resolve it. After making the change:

1. Commit and push:
   ```bash
   git add prisma/schema.prisma
   git commit -m "fix: update binary targets for GitHub Actions"
   git push origin main
   ```

2. Watch the workflow logs for:
   ```
   🔧 Step 1: Generating Prisma client...
   ✅ Prisma client generated successfully
   
   🔍 Step 2: Testing database connection...
   ✅ Database connection successful
   ```

## 📞 **If Still Failing**

If it's still failing after trying the binary targets fix, the debug output will show the exact error message, which will help identify the specific issue (connection timeout, authentication, SSL, etc.).

The key is getting that detailed error message to know exactly what's going wrong!