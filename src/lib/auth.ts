import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import SpotifyProvider from 'next-auth/providers/spotify'
import { prisma } from '@/lib/prisma'

// Spotify scopes for playlist management
const spotifyScopes = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
].join(' ')

// SoundCloud scopes for basic access
const soundcloudScopes = [
  'non-expiring',
].join(' ')

// Custom SoundCloud OAuth Provider
const SoundCloudProvider = {
  id: 'soundcloud',
  name: 'SoundCloud',
  type: 'oauth',
  authorization: {
    url: 'https://secure.soundcloud.com/authorize',
    params: {
      scope: soundcloudScopes,
      response_type: 'code',
      // PKCE parameters will be added automatically by NextAuth
    },
  },
  token: 'https://secure.soundcloud.com/oauth/token',
  userinfo: 'https://api.soundcloud.com/me',
  checks: ['pkce', 'state'], // OAuth 2.1 with PKCE requirement
  profile(profile: any) {
    return {
      id: profile.id.toString(),
      name: profile.username || profile.full_name,
      email: profile.email,
      image: profile.avatar_url,
    }
  },
  clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
  style: {
    logo: '/soundcloud-logo.svg',
    logoDark: '/soundcloud-logo.svg',
    bg: '#ff5500',
    text: '#fff',
    bgDark: '#ff5500',
    textDark: '#fff',
  },
}

// Custom Beatport OAuth Provider
const BeatportProvider = {
  id: 'beatport',
  name: 'Beatport',
  type: 'oauth',
  authorization: {
    url: 'https://oauth-api.beatport.com/authorize',
    params: {
      scope: 'user:read',
      response_type: 'code',
    },
  },
  token: 'https://oauth-api.beatport.com/token',
  userinfo: 'https://oauth-api.beatport.com/user',
  profile(profile: any) {
    return {
      id: profile.id.toString(),
      name: profile.username || profile.display_name,
      email: profile.email,
      image: profile.avatar_url,
    }
  },
  clientId: process.env.BEATPORT_CLIENT_ID!,
  clientSecret: process.env.BEATPORT_CLIENT_SECRET!,
  style: {
    logo: '/beatport-logo.svg',
    logoDark: '/beatport-logo.svg',
    bg: '#01ff95',
    text: '#000',
    bgDark: '#01ff95',
    textDark: '#000',
  },
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Now enabled with proper database setup
  session: {
    strategy: 'database', // Using database sessions with Prisma adapter
  },
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: spotifyScopes,
        },
      },
    }),
    SoundCloudProvider as any, // Custom provider
    BeatportProvider as any, // Custom provider
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow multiple provider connections for the same user
      try {
        if (account && user) {
          // Check if user already exists with a different provider
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || '' },
            include: { accounts: true }
          })

          if (existingUser) {
            // Check if this provider is already connected
            const existingAccount = existingUser.accounts.find(
              acc => acc.provider === account.provider
            )
            
            if (existingAccount) {
              // Update existing account with new tokens
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                }
              })
            }
            // If account doesn't exist, NextAuth will create it automatically
          }
          return true
        }
        return false
      } catch (error) {
        console.error('Sign-in error:', error)
        return false
      }
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Fetch all connected accounts for the user
        const userWithAccounts = await prisma.user.findUnique({
          where: { id: user.id },
          include: { accounts: true }
        })

        // Add connected providers to the session
        session.connectedProviders = userWithAccounts?.accounts.map(account => ({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          hasValidToken: !!account.access_token
        })) || []
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after authentication
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },
}