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