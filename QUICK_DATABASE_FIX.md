# 🚀 Quick Database Fix - Manual Steps

## 🚨 Current Issue
Your Vercel deployment shows: `The table 'public.Account' does not exist in the current database.`

This means the database tables haven't been created yet.

## ✅ Quick Fix (5 minutes)

### Step 1: Pull Environment Variables
```bash
# Login to Vercel (if not already)
vercel login

# Pull environment variables
vercel env pull .env.local
```

### Step 2: Run Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Apply migration to create all tables
npx prisma migrate deploy
```

### Step 3: Redeploy Application
```bash
# Deploy to production
vercel --prod
```

## 🔧 Alternative: Use Database Push
If migration fails, try this instead:

```bash
# Push schema directly to database
npx prisma db push

# Generate client
npx prisma generate

# Deploy
vercel --prod
```

## 🎯 What This Will Create

Your database will get these tables:
- ✅ `Account` - For Spotify OAuth
- ✅ `Session` - For user sessions  
- ✅ `User` - For user profiles
- ✅ `Playlist` - For playlists
- ✅ `Song` - For song metadata
- ✅ `PlaylistSong` - For playlist-song relationships
- ✅ `PurchaseHistory` - For purchase tracking
- ✅ `VerificationToken` - For email verification

## 🔍 Verify It Worked

1. **Check your deployed app** - The error should be gone
2. **Test sign in** - Try signing in with Spotify
3. **Check database** - Run `npx prisma studio` to see the tables

## 🚨 If You Get Errors

### "Environment variable not found"
```bash
# Make sure you pulled the variables
vercel env pull .env.local

# Check they exist
cat .env.local
```

### "Migration failed"
```bash
# Try the push approach instead
npx prisma db push --accept-data-loss
```

### "Database connection timeout"
- Check your database is running
- Verify connection strings in Vercel dashboard

## 📋 Complete Command Sequence

Copy and paste these commands one by one:

```bash
# 1. Pull environment variables
vercel env pull .env.local

# 2. Generate Prisma client  
npx prisma generate

# 3. Apply migration
npx prisma migrate deploy

# 4. Deploy application
vercel --prod
```

## 🎉 Success Indicators

You'll know it worked when:
- ✅ No more "table does not exist" errors
- ✅ You can sign in with Spotify
- ✅ User data persists after sign in

---

**Time to fix**: ~5 minutes
**Difficulty**: Easy

Run the commands above and your database tables will be created!