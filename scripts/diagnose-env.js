// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Variable Diagnostics')
console.log('==================================\n')

// Check if .env.local exists
const fs = require('fs')
const path = require('path')

const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file found')
} else {
  console.log('❌ .env.local file not found')
  process.exit(1)
}

// Show environment variables
console.log('\n📋 Current Environment Variables:')
console.log('=================================')

const requiredVars = [
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL', 
  'POSTGRES_URL_NON_POOLING',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

const optionalVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'NODE_ENV'
]

console.log('\n🔑 Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    // Check if it's a placeholder
    const isPlaceholder = value.includes('username:password') || 
                         value.includes('example') || 
                         value.includes('your-') ||
                         value === 'your-nextauth-secret-here'
    
    if (isPlaceholder) {
      console.log(`  ⚠️  ${varName}: PLACEHOLDER VALUE DETECTED`)
      console.log(`      Value: ${value}`)
    } else {
      // Mask sensitive parts of the URL
      const maskedValue = value.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
      console.log(`  ✅ ${varName}: ${maskedValue}`)
    }
  } else {
    console.log(`  ❌ ${varName}: NOT SET`)
  }
})

console.log('\n🔧 Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    const isPlaceholder = value.includes('your-')
    if (isPlaceholder) {
      console.log(`  ⚠️  ${varName}: PLACEHOLDER VALUE`)
    } else {
      console.log(`  ✅ ${varName}: SET`)
    }
  } else {
    console.log(`  ➖ ${varName}: NOT SET`)
  }
})

// Check for placeholder patterns
const hasPlaceholders = requiredVars.some(varName => {
  const value = process.env[varName]
  return value && (
    value.includes('username:password') || 
    value.includes('example') || 
    value.includes('your-') ||
    value === 'your-nextauth-secret-here'
  )
})

console.log('\n🎯 Diagnosis:')
console.log('============')

if (hasPlaceholders) {
  console.log('❌ ISSUE FOUND: Placeholder values detected in environment variables')
  console.log('\n💡 Solution:')
  console.log('   You need to replace the placeholder values in .env.local with actual credentials.')
  console.log('\n📝 Next Steps:')
  console.log('   1. If you have a Vercel project with database:')
  console.log('      Run: npx vercel env pull .env.local')
  console.log('')
  console.log('   2. If you want to use Neon database:')
  console.log('      - Go to https://console.neon.tech')
  console.log('      - Create a new project')
  console.log('      - Copy the connection strings to .env.local')
  console.log('')
  console.log('   3. For local development:')
  console.log('      Run: npm run db:setup-local')
} else {
  console.log('✅ Environment variables look good!')
  console.log('   If you\'re still having connection issues, check:')
  console.log('   - Network connectivity')
  console.log('   - Database server status')
  console.log('   - Firewall settings')
}

console.log('\n📖 Documentation:')
console.log('   - DATABASE_CONNECTION_FIX.md')
console.log('   - DATABASE_SETUP_SOLUTION.md')