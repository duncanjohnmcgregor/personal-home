# Vercel Deployment Secrets Setup Guide

## 🚨 Current Issue
The deployment is failing because required Vercel secrets are not configured in the GitHub repository.

**Error**: `Input required and not supplied: vercel-token`

## 🔧 Quick Fix Options

### Option 1: Configure GitHub Secrets (Recommended)

#### Step 1: Get Vercel Token
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile (bottom left) → **Settings**
3. Navigate to **Tokens** tab
4. Click **Create Token**
5. Name it (e.g., "GitHub Actions")
6. Copy the generated token

#### Step 2: Get Project Information
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run in project root)
vercel link

# Get project info
vercel project ls
```

#### Step 3: Add Secrets to GitHub Repository
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `VERCEL_TOKEN` | Your Vercel token | From Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Your organization ID | Run `vercel org ls` or check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your project ID | Check `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_NAME` | Your project name | Usually your repo name or custom domain |

#### Step 4: Add Production Environment (Optional)
1. In GitHub repo settings → **Environments**
2. Create environment named `production`
3. Add environment protection rules if needed

### Option 2: Alternative Workflow with Vercel CLI

If you prefer not to use the third-party action, here's a workflow using official Vercel CLI:

```yaml
name: Deploy to Production (Vercel CLI)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma client
      run: npx prisma generate

    - name: Run tests and checks
      run: |
        npm run type-check
        npm run lint
        npm run build

    - name: Install Vercel CLI
      run: npm install --global vercel@latest

    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

    - name: Build Project Artifacts
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

    - name: Deploy Project Artifacts to Vercel
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🎯 Immediate Action Required

Choose one of these approaches:

### Quick Setup (5 minutes):
1. Get Vercel token from dashboard
2. Run `vercel link` in your project
3. Add the 4 secrets to GitHub repository
4. Push a commit to trigger deployment

### Alternative Setup:
1. Replace the workflow file with Option 2 above
2. Only need `VERCEL_TOKEN` secret
3. Commit and push

## 🔍 Troubleshooting

### Check if secrets are set:
```bash
# This will show if secrets exist (but not their values)
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/USERNAME/REPO/actions/secrets
```

### Verify Vercel project:
```bash
vercel project ls
vercel env ls
```

### Test deployment locally:
```bash
vercel --prod
```

## 📋 Next Steps

1. **Set up secrets** using Option 1 above
2. **Push a small commit** to trigger deployment
3. **Monitor** GitHub Actions tab for success
4. **Verify** deployment at your Vercel URL

Once secrets are configured, the deployment should work automatically on every push to main branch.