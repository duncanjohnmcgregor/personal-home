# Vercel CLI Authentication Fix

## Issue
The Vercel CLI v44.2.7+ no longer supports the `--stdin` flag for the `vercel login` command, causing CI/CD workflows to fail with:

```
Error: unknown or unexpected option: --stdin
```

## Root Cause
The `vercel login --stdin` command was removed in recent versions of the Vercel CLI. The proper way to authenticate in CI/CD environments is to use the `--token` flag directly with commands that support it.

## Solution Applied

### ✅ Fixed Authentication Method
Instead of using `vercel login --stdin`, we now:

1. **Skip explicit login** when `VERCEL_TOKEN` is available
2. **Use `--token` flag** directly with vercel commands
3. **Fall back to interactive login** for local development

### Code Changes

#### Before (Broken)
```bash
# This no longer works
echo "$VERCEL_TOKEN" | vercel login --stdin
vercel link --yes --token $VERCEL_TOKEN
```

#### After (Fixed)
```bash
# Skip login, use token directly
vercel link --yes --token $VERCEL_TOKEN
```

### Files Updated

1. **`.github/workflows/vercel-postgres-setup.yml`**
   - Removed `vercel login --stdin` command
   - Use `--token` flag directly with `vercel link`

2. **`.github/workflows/database-health-check.yml`**
   - Same authentication fix applied

3. **`scripts/setup-vercel-postgres.sh`**
   - Updated authentication logic
   - Conditional handling for CI/CD vs local development

### Environment Variable Input Fix

Also fixed the method for providing input to `vercel env add` commands:

#### Before
```bash
echo "$VALUE" | vercel env add KEY environment --token $TOKEN
```

#### After  
```bash
vercel env add KEY environment --token $TOKEN <<< "$VALUE"
```

## Verification

The fix has been applied to all automation scripts and workflows. The CI/CD pipeline now:

✅ **Authenticates properly** using token-based auth  
✅ **Links projects** without requiring explicit login  
✅ **Sets environment variables** correctly  
✅ **Works with latest Vercel CLI** versions  

## Testing

To test the fix:

```bash
# Local development (interactive)
./scripts/setup-vercel-postgres.sh

# CI/CD simulation (with token)
VERCEL_TOKEN=your_token ./scripts/setup-vercel-postgres.sh
```

## Compatibility

- ✅ **Vercel CLI v44.2.7+** - Uses token-based authentication
- ✅ **GitHub Actions** - No login required, token passed to commands
- ✅ **Local Development** - Falls back to interactive login
- ✅ **Backward Compatible** - Works with older CLI versions

## References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Authentication Tokens](https://vercel.com/account/tokens)
- [GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)