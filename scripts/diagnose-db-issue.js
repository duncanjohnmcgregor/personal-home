#!/usr/bin/env node

// Diagnostic script to identify database connection issues
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

console.log('🔍 Database Connection Diagnostic Tool')
console.log('======================================\n')

// 1. Check Environment Variables
console.log('📋 Environment Variables Check:')
const requiredVars = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
  'DATABASE_URL'
]

const envStatus = {}
requiredVars.forEach(varName => {
  const value = process.env[varName]
  envStatus[varName] = {
    set: !!value,
    hasValue: value && value.length > 0,
    isPlaceholder: value && (value.includes('username:password') || value.includes('example'))
  }
  
  if (envStatus[varName].set) {
    if (envStatus[varName].isPlaceholder) {
      console.log(`❌ ${varName}: Contains placeholder values`)
    } else {
      console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`)
    }
  } else {
    console.log(`❌ ${varName}: Not set`)
  }
})

console.log('\n📊 Environment Variable Analysis:')
if (envStatus.POSTGRES_PRISMA_URL.set && !envStatus.POSTGRES_PRISMA_URL.isPlaceholder) {
  console.log('✅ Primary connection URL (POSTGRES_PRISMA_URL) is configured')
} else {
  console.log('❌ Primary connection URL (POSTGRES_PRISMA_URL) is missing or placeholder')
}

if (envStatus.POSTGRES_URL_NON_POOLING.set && !envStatus.POSTGRES_URL_NON_POOLING.isPlaceholder) {
  console.log('✅ Direct connection URL (POSTGRES_URL_NON_POOLING) is configured')
} else {
  console.log('❌ Direct connection URL (POSTGRES_URL_NON_POOLING) is missing or placeholder')
}

// 2. Connection String Analysis
console.log('\n🔗 Connection String Analysis:')
const primaryUrl = process.env.POSTGRES_PRISMA_URL
if (primaryUrl) {
  try {
    const url = new URL(primaryUrl)
    console.log(`✅ Protocol: ${url.protocol}`)
    console.log(`✅ Host: ${url.hostname}`)
    console.log(`✅ Port: ${url.port || 5432}`)
    console.log(`✅ Database: ${url.pathname.substring(1)}`)
    console.log(`✅ Username: ${url.username || 'not specified'}`)
    console.log(`✅ Password: ${url.password ? 'set' : 'not set'}`)
    
    // Check for connection pooling parameters
    const params = new URLSearchParams(url.search)
    if (params.get('pgbouncer')) {
      console.log('✅ Connection pooling enabled (pgbouncer=true)')
    } else {
      console.log('⚠️ Connection pooling not detected in URL')
    }
    
    if (params.get('connection_limit')) {
      console.log(`✅ Connection limit: ${params.get('connection_limit')}`)
    }
    
  } catch (error) {
    console.log(`❌ Invalid URL format: ${error.message}`)
  }
} else {
  console.log('❌ No primary connection URL to analyze')
}

// 3. Prisma Client Test
console.log('\n🧪 Prisma Client Connection Test:')

async function testConnection() {
  let prisma
  
  try {
    console.log('📦 Creating Prisma Client...')
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL
        }
      }
    })
    
    console.log('🔌 Testing connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    console.log('🏥 Testing basic operations...')
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`
    console.log('✅ Basic query successful:', result)
    
    // Test schema access
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User table accessible (${userCount} records)`)
    } catch (error) {
      console.log(`❌ User table access failed: ${error.message}`)
    }
    
    try {
      const playlistCount = await prisma.playlist.count()
      console.log(`✅ Playlist table accessible (${playlistCount} records)`)
    } catch (error) {
      console.log(`❌ Playlist table access failed: ${error.message}`)
    }
    
    console.log('\n🎉 All connection tests passed!')
    
  } catch (error) {
    console.log(`\n❌ Connection test failed:`)
    console.log(`Error Code: ${error.code || 'Unknown'}`)
    console.log(`Error Message: ${error.message}`)
    
    // Provide specific troubleshooting based on error
    if (error.code === 'P1001') {
      console.log('\n💡 P1001 - Can\'t reach database server:')
      console.log('• Check your internet connection')
      console.log('• Verify the database server is running')
      console.log('• Check if the host/port is correct')
      console.log('• Verify firewall/security group settings')
    } else if (error.code === 'P1002') {
      console.log('\n💡 P1002 - Database server unreachable:')
      console.log('• Database server might be down')
      console.log('• Network connectivity issues')
      console.log('• Check if the connection URL is correct')
    } else if (error.code === 'P1008') {
      console.log('\n💡 P1008 - Operations timed out:')
      console.log('• Database server might be overloaded')
      console.log('• Try increasing connection timeout')
      console.log('• Check if connection pooling is configured correctly')
    } else if (error.code === 'P1003') {
      console.log('\n💡 P1003 - Database does not exist:')
      console.log('• Check if the database name in the URL is correct')
      console.log('• Verify the database was created')
    } else if (error.code === 'P1011') {
      console.log('\n💡 P1011 - Authentication failed:')
      console.log('• Check username and password in connection string')
      console.log('• Verify the user has the required permissions')
    }
    
    console.log('\n🔧 General troubleshooting steps:')
    console.log('1. Verify all environment variables are set correctly')
    console.log('2. Test the connection string manually')
    console.log('3. Check database server status')
    console.log('4. Verify network connectivity')
    
  } finally {
    if (prisma) {
      await prisma.$disconnect()
      console.log('\n🔌 Prisma client disconnected')
    }
  }
}

// 4. GitHub Actions Environment Check
console.log('\n🔧 GitHub Actions Environment Check:')
if (process.env.GITHUB_ACTIONS) {
  console.log('✅ Running in GitHub Actions environment')
  console.log('📍 Make sure GitHub Secrets are configured:')
  console.log('  • POSTGRES_PRISMA_URL')
  console.log('  • POSTGRES_URL_NON_POOLING') 
  console.log('  • NEXTAUTH_SECRET')
} else {
  console.log('ℹ️ Running in local environment')
  console.log('📍 Make sure .env.local file is configured properly')
}

// Run the connection test
testConnection()
  .then(() => {
    console.log('\n✅ Diagnostic completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.log('\n❌ Diagnostic failed with unexpected error:', error)
    process.exit(1)
  })