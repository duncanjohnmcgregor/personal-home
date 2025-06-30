# 🚀 Quick Setup: VERCEL_TOKEN Secret

## Step 1: Get Your Vercel Token (2 minutes)

1. **Open**: [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. **Click**: "Create" button
3. **Name**: "GitHub Actions"
4. **Click**: "Create"
5. **Copy**: The token (starts with `vercel_...`)

⚠️ **Important**: Copy immediately - you can't see it again!

## Step 2: Add to GitHub Repository (1 minute)

1. **Go to**: https://github.com/duncanjohnmcgregor/personal-home/settings/secrets/actions
2. **Click**: "New repository secret"
3. **Name**: `VERCEL_TOKEN`
4. **Value**: Paste your token
5. **Click**: "Add secret"

## Step 3: Test Deployment

Push any small change or trigger manually:
```bash
# Option 1: Trigger manually in GitHub
Go to Actions tab → Deploy to Production → Run workflow

# Option 2: Push a small change
git commit --allow-empty -m "Test Vercel deployment"
git push origin main
```

## ✅ Success Signs

After adding the token, your next deployment should show:
```
✅ VERCEL_TOKEN is configured
📦 Installing Vercel CLI...
🔗 Pulling Vercel Environment Information...
🏗️ Building Project Artifacts...
🚀 Deploying to Vercel...
✅ Production deployment successful
```

## 🆘 Still Having Issues?

- Check the GitHub Actions tab for detailed logs
- Verify token starts with `vercel_`
- Ensure secret name is exactly `VERCEL_TOKEN`
- See `VERCEL_SECRETS_SETUP.md` for detailed troubleshooting

**Total Setup Time**: ~3 minutes 🕒