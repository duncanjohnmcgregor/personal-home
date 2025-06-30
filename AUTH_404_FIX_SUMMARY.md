# Auth 404 Error Fix Summary

## Problem
The app was getting a 404 error when trying to access `https://personal-home-kappa.vercel.app/auth/signin`.

## Root Cause
The NextAuth.js configuration in `src/lib/auth.ts` was set to use custom authentication pages:

```typescript
pages: {
  signIn: '/auth/signin',
  error: '/auth/error',
},
```

However, the actual page components at `/auth/signin` and `/auth/error` were not created in the app directory structure. This meant that when users were redirected to `/auth/signin`, Next.js couldn't find the page and returned a 404 error.

## Solution
I fixed this by removing the custom pages configuration from the NextAuth options and updating all references to use NextAuth's default authentication pages:

### Changes Made:

1. **Removed custom pages configuration** from `src/lib/auth.ts`:
   ```diff
   - pages: {
   -   signIn: '/auth/signin',
   -   error: '/auth/error',
   - },
   ```

2. **Updated redirect in main page** (`src/app/page.tsx`):
   ```diff
   - redirect('/auth/signin')
   + redirect('/api/auth/signin')
   ```

3. **Updated navbar link** (`src/components/layout/navbar.tsx`):
   ```diff
   - <Link href="/auth/signin">
   + <Link href="/api/auth/signin">
   ```

## How It Works Now
- Users visiting the root URL are redirected to `/api/auth/signin` (NextAuth's default signin page)
- NextAuth handles the authentication flow using its built-in pages
- After successful authentication, users are redirected back to the app

## Alternative Solution
If you want custom authentication pages in the future, you would need to:
1. Create the actual page components at `src/app/auth/signin/page.tsx` and `src/app/auth/error/page.tsx`
2. Ensure the pages properly integrate with NextAuth's authentication flow
3. Re-enable the custom pages configuration

## Deployment
The fix has been merged to the main branch and should trigger an automatic deployment on Vercel. The authentication should now work correctly at:
- Main site: https://personal-home-kappa.vercel.app/
- Auth: https://personal-home-kappa.vercel.app/api/auth/signin