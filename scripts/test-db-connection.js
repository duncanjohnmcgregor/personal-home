const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  console.log('🔄 Testing database connection...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test environment variables
    console.log('\n📋 Environment Variables:')
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing')
    console.log('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL ? '✅ Set' : '❌ Missing')
    console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '✅ Set' : '❌ Missing')
    
    // Test basic database operations
    console.log('\n🧪 Testing database operations...')
    
    // Count existing users
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    // Count existing playlists
    const playlistCount = await prisma.playlist.count()
    console.log(`📊 Playlists in database: ${playlistCount}`)
    
    // Count existing songs
    const songCount = await prisma.song.count()
    console.log(`📊 Songs in database: ${songCount}`)
    
    console.log('\n✅ All database tests passed!')
    
  } catch (error) {
    console.error('\n❌ Database connection failed:')
    console.error('Error:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting tips:')
      console.error('1. Check your internet connection')
      console.error('2. Verify your database credentials')
      console.error('3. Ensure your database is running')
      console.error('4. Check firewall settings')
    }
    
    if (error.code === 'P1008') {
      console.error('\n💡 Database timeout - possible issues:')
      console.error('1. Database server might be overloaded')
      console.error('2. Network connectivity issues')
      console.error('3. Try increasing timeout in connection string')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the test
testDatabaseConnection()
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })