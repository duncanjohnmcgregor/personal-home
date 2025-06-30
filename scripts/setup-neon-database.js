#!/usr/bin/env node

/**
 * Neon Database Setup Script for Music Playlist Manager
 * 
 * This script helps you set up a Neon Postgres database and configure
 * the necessary environment variables for your application.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function updateEnvFile(connectionStrings, spotifyCredentials = {}) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  const envContent = `# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecureSecret()}

# Neon Postgres Database URLs
POSTGRES_URL="${connectionStrings.direct}"
POSTGRES_PRISMA_URL="${connectionStrings.pooled}"
POSTGRES_URL_NON_POOLING="${connectionStrings.direct}"

# Spotify API (Get these from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=${spotifyCredentials.clientId || 'your-spotify-client-id'}
SPOTIFY_CLIENT_SECRET=${spotifyCredentials.clientSecret || 'your-spotify-client-secret'}

# Optional: For development
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  log('✅ Updated .env.local file with database configuration', 'green');
}

async function checkNeonCLI() {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const neon = spawn('neon', ['--version'], { stdio: 'pipe' });
    
    neon.on('close', (code) => {
      resolve(code === 0);
    });
    
    neon.on('error', () => {
      resolve(false);
    });
  });
}

async function checkVercelCLI() {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const vercel = spawn('vercel', ['--version'], { stdio: 'pipe' });
    
    vercel.on('close', (code) => {
      resolve(code === 0);
    });
    
    vercel.on('error', () => {
      resolve(false);
    });
  });
}

function showManualSetupInstructions() {
  log('\n📋 Manual Database Setup Instructions', 'bold');
  log('========================================', 'cyan');
  
  log('\n1. Create a Neon Account and Database:', 'yellow');
  log('   • Go to https://console.neon.tech');
  log('   • Sign up or log in');
  log('   • Click "New Project"');
  log('   • Choose a project name (e.g., "music-playlist-manager")');
  log('   • Select a region close to your users');
  log('   • Click "Create Project"');
  
  log('\n2. Get Your Database Connection Strings:', 'yellow');
  log('   • In your Neon project dashboard, click "Connect"');
  log('   • Copy the connection strings:');
  log('     - Direct connection (for migrations)');
  log('     - Pooled connection (for app queries)');
  log('   • The strings will look like:');
  log('     postgresql://user:pass@ep-xxx-123456.region.aws.neon.tech/neondb');
  
  log('\n3. Update Your .env.local File:', 'yellow');
  log('   • Replace the placeholder values in .env.local with your actual:');
  log('     - POSTGRES_URL (direct connection)');
  log('     - POSTGRES_PRISMA_URL (pooled connection)');
  log('     - POSTGRES_URL_NON_POOLING (direct connection)');
  
  log('\n4. Set Up Spotify API (Optional):', 'yellow');
  log('   • Go to https://developer.spotify.com/dashboard');
  log('   • Create a new app');
  log('   • Add redirect URI: http://localhost:3000/api/auth/callback/spotify');
  log('   • Copy Client ID and Client Secret to .env.local');
  
  log('\n5. Test Your Setup:', 'yellow');
  log('   • Run: npm run db:test');
  log('   • Run: npm run db:push (to create tables)');
  log('   • Run: npm run dev (to start the application)');
  
  log('\n🔗 Helpful Links:', 'cyan');
  log('   • Neon Console: https://console.neon.tech');
  log('   • Spotify Developer: https://developer.spotify.com/dashboard');
  log('   • Project Documentation: ./DATABASE_SETUP_SOLUTION.md');
}

function showExampleConnectionStrings() {
  log('\n📝 Example Connection Strings Format:', 'cyan');
  log('=====================================');
  
  log('\nDirect Connection (POSTGRES_URL & POSTGRES_URL_NON_POOLING):', 'yellow');
  log('postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb');
  
  log('\nPooled Connection (POSTGRES_PRISMA_URL):', 'yellow');
  log('postgresql://username:password@ep-example-123456-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true&connection_limit=1');
  
  log('\n💡 Replace with your actual values from Neon Console!', 'magenta');
}

async function main() {
  log('🚀 Neon Database Setup for Music Playlist Manager', 'bold');
  log('================================================', 'cyan');
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Error: Please run this script from the project root directory', 'red');
    process.exit(1);
  }
  
  // Check for existing .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    log('📁 Found existing .env.local file', 'blue');
  } else {
    log('📁 Creating new .env.local file', 'blue');
  }
  
  // Check for CLI tools
  const hasVercel = await checkVercelCLI();
  const hasNeon = await checkNeonCLI();
  
  log('\n🔍 Checking available tools:', 'blue');
  log(`   Vercel CLI: ${hasVercel ? '✅ Available' : '❌ Not installed'}`);
  log(`   Neon CLI: ${hasNeon ? '✅ Available' : '❌ Not available'}`);
  
  if (!hasVercel && !hasNeon) {
    log('\n⚠️  No database CLI tools found. Manual setup required.', 'yellow');
    showManualSetupInstructions();
    showExampleConnectionStrings();
    
    // Create a template .env.local file
    const templateEnv = `# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecureSecret()}

# Neon Postgres Database URLs (Replace with your actual Neon database credentials)
# Get these from: https://console.neon.tech/app/projects
POSTGRES_URL="postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb"
POSTGRES_PRISMA_URL="postgresql://username:password@ep-example-123456-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb"

# Spotify API (Get these from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional: For development
NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, templateEnv);
    log('\n✅ Created template .env.local file with secure NEXTAUTH_SECRET', 'green');
    log('📝 Please update the database URLs and Spotify credentials manually', 'yellow');
    
  } else if (hasVercel) {
    log('\n🔧 Vercel CLI detected. You can use Vercel Postgres:', 'green');
    log('\n📋 Vercel Postgres Setup Steps:', 'yellow');
    log('1. Run: vercel login');
    log('2. Run: vercel link (link your project)');
    log('3. Run: vercel storage create postgres');
    log('4. Run: vercel env pull .env.local');
    log('5. Run: npm run db:push');
    
    // Create a template for now
    const templateEnv = `# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecureSecret()}

# Neon Postgres Database URLs (These will be populated by 'vercel env pull')
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Spotify API (Get these from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional: For development
NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, templateEnv);
    log('✅ Created template .env.local file', 'green');
  }
  
  log('\n🎯 Next Steps:', 'bold');
  log('1. Update .env.local with your actual database credentials');
  log('2. Run: npm run db:test (to test database connection)');
  log('3. Run: npm run db:push (to create database tables)');
  log('4. Run: npm run dev (to start the application)');
  
  log('\n📚 For more help, see:', 'cyan');
  log('   • DATABASE_SETUP_SOLUTION.md');
  log('   • VERCEL_POSTGRES_SETUP.md');
  log('   • https://neon.tech/docs/get-started-with-neon/signing-up');
}

// Run the script
main().catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});