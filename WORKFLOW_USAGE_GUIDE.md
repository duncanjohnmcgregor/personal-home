# GitHub Actions Workflow Usage Guide

## Overview

The CI/CD workflows have been optimized to provide fast deployments by caching build artifacts from the CI workflow and reusing them in the deployment workflow.

## Workflow Triggers

### CI Workflow (`.github/workflows/ci.yml`)
- **Triggers on**: 
  - Push to `develop` branch
  - Pull requests to `main` or `develop` branches
- **Purpose**: Build, test, and cache artifacts for future deployments

### CD Workflow (`.github/workflows/deploy-production.yml`)
- **Triggers on**: 
  - Push to `main` branch
  - Manual workflow dispatch
- **Purpose**: Deploy to production using cached artifacts when possible

## Deployment Scenarios

### 🚀 Fast Deployment (Cache Hit)

**When this happens:**
- You merge a PR that was tested by CI
- The exact commit SHA has cached artifacts
- Cache hasn't expired (GitHub cache retention: ~7 days)

**Expected behavior:**
- ✅ Deployment completes in ~2-3 minutes
- ✅ Skips dependency installation and building
- ✅ Uses pre-built artifacts from CI

**Example workflow:**
```
1. Create PR: feature → develop
2. CI runs automatically, caches artifacts
3. Merge PR: develop → main  
4. CD runs with cache hit = FAST deployment
```

### 🔧 Fallback Deployment (Cache Miss)

**When this happens:**
- Direct push to `main` (bypassing develop)
- Cache expired or was evicted
- Different commit SHA than what CI built
- First deployment of a new repository

**Expected behavior:**
- ⚠️ Deployment takes ~5-7 minutes (normal build time)
- 🔧 Builds everything from scratch
- ✅ Still deploys successfully

**Example workflow:**
```
1. Hotfix: Direct push to main
2. CD runs with cache miss = SLOWER deployment (but still works)
```

## Best Practices for Fast Deployments

### Recommended Git Flow
```
feature branch → develop → main
     ↓             ↓        ↓
  (no CI)     (CI runs)  (CD runs)
               builds &   fast deploy
               caches     using cache
```

### To Ensure Cache Hits
1. **Always merge through develop**: Create PRs to `develop` first
2. **Let CI complete**: Wait for CI to finish before merging to `main`
3. **Merge quickly**: Don't let too much time pass between CI and deployment

### When Cache Misses Are Expected
- **Hotfixes**: Direct pushes to main for urgent fixes
- **First deployments**: New repositories or after cache expiration
- **Large time gaps**: If more than a week passes between CI and deployment

## Troubleshooting

### Cache Miss Error Message
```
❌ Build artifacts (.next) missing
ℹ️ This indicates cache miss - CI likely ran on a different commit
```

**Solution**: This is normal! The workflow will automatically build from scratch.

### Debugging Cache Issues

1. **Check CI status**: Ensure CI workflow completed on the commit you're deploying
2. **Verify commit SHA**: Check if the deployment commit matches the CI commit
3. **Check cache age**: GitHub caches expire after ~7 days of inactivity

### Manual Cache Debugging

You can check cache information in the deployment logs:
```yaml
📊 Cache Status Summary
======================
Cache hit: false
Current commit: abc123...
Current ref: refs/heads/main
```

## Performance Comparison

| Scenario | Duration | Steps Skipped | When It Happens |
|----------|----------|---------------|-----------------|
| **Cache Hit** | ~2-3 min | Dependencies, Build, Prisma | Normal PR flow |
| **Cache Miss** | ~5-7 min | None (full build) | Direct push to main |

## Common Questions

### Q: Why is my deployment slow?
**A**: Check if you're getting a cache hit. Slow deployments indicate cache miss, which is expected in certain scenarios.

### Q: Can I force a fast deployment?
**A**: Fast deployments happen automatically when cache is available. You can't force it, but following the recommended git flow maximizes cache hits.

### Q: What if CI failed but I need to deploy?
**A**: The deployment will work fine with cache miss - it just takes longer. Fix the CI issue for future fast deployments.

### Q: How long do caches last?
**A**: GitHub Actions caches expire after 7 days of inactivity or when the repository reaches cache size limits.

## Monitoring Performance

Track your deployment performance by looking for these log messages:

**Fast Deployment:**
```
✅ Using cached artifacts from CI workflow
🚀 Fast deployment mode activated
🎉 Deployment completed in record time thanks to cached artifacts!
```

**Fallback Deployment:**
```
⚠️ Cache miss - will build from scratch
🔧 Built fresh artifacts (no cache available)
🎉 Deployment completed successfully with fallback build!
```

---

This system provides the best of both worlds: lightning-fast deployments when possible, with reliable fallback when needed.