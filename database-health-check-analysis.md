# Database Health Check & Maintenance GitHub Action Analysis

## Overview
The Database Health Check & Maintenance GitHub Action (`database-health-check.yml`) is experiencing issues. Based on my analysis of the workflow configuration and codebase, here are the potential problems and solutions.

## Identified Issues

### 1. **Table Name Case Sensitivity Problem**
**Issue**: The health check script references table names in camelCase (`user`, `playlist`, `song`, `playlistSong`, `account`, `session`), but Prisma models are typically PascalCase (`User`, `Playlist`, `Song`, `PlaylistSong`, `Account`, `Session`).

**Location**: Lines 60-62 in `database-health-check.yml`
```javascript
const tables = ['user', 'playlist', 'song', 'playlistSong', 'account', 'session']
```

**Solution**: Update to use correct Prisma model names:
```javascript
const tables = ['User', 'Playlist', 'Song', 'PlaylistSong', 'Account', 'Session']
```

### 2. **Missing Table References**
**Issue**: The health check doesn't include all tables defined in the Prisma schema.

**Missing Tables**:
- `VerificationToken`
- `PurchaseHistory`

### 3. **Incorrect Orphaned Records Query**
**Issue**: The orphaned records check is looking for `playlist: null` which is incorrect for Prisma relations.

**Location**: Lines 95-99 in `database-health-check.yml`
```javascript
const orphanedSongs = await prisma.playlistSong.count({
  where: {
    playlist: null
  }
})
```

**Solution**: Use proper relation checking or foreign key validation.

### 4. **Environment Variables Setup Issue**
**Issue**: The workflow creates `.env.production` but doesn't properly handle environment variable loading for Node.js scripts.

**Location**: Lines 33-36 in `database-health-check.yml`

### 5. **PostgreSQL-Specific Commands in Maintenance**
**Issue**: The maintenance script uses PostgreSQL-specific `ANALYZE` command which might not work with Neon's connection pooling.

**Location**: Lines 169-170 in `database-health-check.yml`

## Recommended Fixes

### Fix 1: Correct Table Names and Add Missing Tables
```yaml
# Update the health check script
const tables = ['User', 'Playlist', 'Song', 'PlaylistSong', 'Account', 'Session', 'VerificationToken', 'PurchaseHistory']
```

### Fix 2: Improve Environment Variable Handling
```yaml
- name: Setup environment variables
  run: |
    echo "POSTGRES_PRISMA_URL=${{ secrets.POSTGRES_PRISMA_URL }}" >> $GITHUB_ENV
    echo "POSTGRES_URL_NON_POOLING=${{ secrets.POSTGRES_URL_NON_POOLING }}" >> $GITHUB_ENV
    echo "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" >> $GITHUB_ENV
```

### Fix 3: Fix Orphaned Records Check
```javascript
// Check for orphaned PlaylistSong records
const orphanedSongs = await prisma.playlistSong.findMany({
  where: {
    OR: [
      { playlist: { is: null } },
      { song: { is: null } }
    ]
  }
})
```

### Fix 4: Handle Neon Database Specifics
```javascript
// Replace PostgreSQL ANALYZE with Neon-compatible operations
console.log('📊 Refreshing connection pool...')
await prisma.$disconnect()
await prisma.$connect()
```

## Quick Fix Implementation

### Immediate Action Required:
1. **Update table names** from lowercase to PascalCase
2. **Fix environment variable loading** method
3. **Remove PostgreSQL-specific commands** that don't work with Neon

### Testing Recommendations:
1. Run the workflow manually using `workflow_dispatch`
2. Check GitHub Actions secrets are properly configured:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING` 
   - `NEXTAUTH_SECRET`
3. Verify Neon database connectivity

## Expected Error Messages
Based on the issues identified, you're likely seeing:
- `TypeError: Cannot read property 'count' of undefined` (due to incorrect table names)
- Environment variable loading errors
- Database connection timeouts or permission errors

## Next Steps
1. Apply the fixes to the workflow file
2. Test with manual workflow dispatch
3. Monitor the next scheduled run (every 6 hours)
4. Consider adding better error handling and logging

## Additional Recommendations
- Add retry logic for database connections
- Implement proper error handling for each table check
- Consider using Neon's API for backup verification instead of generic checks
- Add notifications (Slack/email) for critical health check failures