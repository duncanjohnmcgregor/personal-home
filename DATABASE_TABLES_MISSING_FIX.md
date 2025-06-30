# 🗄️ Database Tables Missing Fix

## 🚨 Problem
Your Vercel deployment is now failing with this error:
```
The table `public.Account` does not exist in the current database.
```

This means:
- ✅ Environment variables are now configured correctly
- ❌ Database tables haven't been created yet

## ✅ Solution

You need to run your Prisma migrations to create the database tables in your production database.

### Option 1: Deploy with Database Migration (Recommended)

The easiest way is to run the migration as part of your deployment process:

```bash
# 1. Make sure you have the latest environment variables
vercel env pull .env.local

# 2. Generate Prisma client
npm run db:generate

# 3. Apply migrations to your production database
npx prisma migrate deploy

# 4. Deploy your application
vercel --prod
```

### Option 2: Run Migration Manually

If you want to run the migration manually:

```bash
# 1. Set your production database URL
export POSTGRES_PRISMA_URL="your-production-database-url"

# 2. Run the migration
npx prisma migrate deploy

# 3. Verify tables were created
npx prisma studio
```

### Option 3: Use Database Push (Development/Testing)

For development or if you don't want to use migrations:

```bash
# 1. Push schema directly to database
npx prisma db push

# 2. Generate Prisma client
npx prisma generate

# 3. Deploy application
vercel --prod
```

## 🔧 Automated Fix Script

I'll create a script to handle this automatically:

```bash
# Run the automated database setup
./scripts/setup-production-database.sh
```

## 🔍 What Tables Will Be Created

Your migration will create these tables:
- `Account` - OAuth account linking (Spotify)
- `Session` - User session management  
- `User` - User accounts and profiles
- `VerificationToken` - Email verification tokens
- `Playlist` - User playlists
- `Song` - Song metadata
- `PlaylistSong` - Playlist-song relationships
- `PurchaseHistory` - Track purchases across platforms

Plus these enums:
- `Platform` - SPOTIFY, BEATPORT, SOUNDCLOUD
- `PurchaseStatus` - PENDING, COMPLETED, FAILED, REFUNDED

## 🚀 Verification Steps

After running the migration:

1. **Check Tables Exist**
   ```bash
   npx prisma studio
   ```

2. **Test Database Connection**
   ```bash
   npm run db:test
   ```

3. **Test Your Application**
   - Visit your deployed URL
   - Try signing in with Spotify
   - Verify no database errors

## 🔧 Common Issues

### Issue: "Migration failed"
**Solutions**:
- Check your database connection string is correct
- Ensure your database is accessible
- Try using `npx prisma db push` instead

### Issue: "Environment variable not found"
**Solution**: Make sure you've pulled the latest environment variables:
```bash
vercel env pull .env.local
```

### Issue: "Database connection timeout"
**Solutions**:
- Check your database is running
- Verify connection strings are correct
- Try using the direct connection string

### Issue: "Permission denied"
**Solution**: Ensure your database user has CREATE TABLE permissions.

## 📋 Quick Checklist

- [ ] Environment variables configured in Vercel
- [ ] Environment variables pulled locally (`vercel env pull .env.local`)
- [ ] Prisma client generated (`npm run db:generate`)
- [ ] Migration applied (`npx prisma migrate deploy`)
- [ ] Application redeployed (`vercel --prod`)
- [ ] Database tables verified (check with Prisma Studio)
- [ ] Application tested (sign in flow works)

## 🎯 Expected Results

After completing these steps:
- ✅ All database tables will exist
- ✅ Users can sign in with Spotify
- ✅ User data will persist between sessions
- ✅ No more "table does not exist" errors

## 🔗 Helpful Commands

```bash
# Check what tables exist
npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Check migration status
npx prisma migrate status
```

---

**Next Step**: Run the automated setup script or follow Option 1 above to fix the missing tables.