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

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Temporarily disabled - using JWT sessions
  session: {
    strategy: 'jwt',
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
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Add custom sign-in validation here if needed
      try {
        // Ensure we have a valid Spotify account
        if (account?.provider === 'spotify' && account?.access_token) {
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
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
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