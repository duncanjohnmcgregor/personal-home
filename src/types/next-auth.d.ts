import { DefaultSession, DefaultUser } from 'next-auth'

export interface ConnectedProvider {
  provider: string
  providerAccountId: string
  hasValidToken: boolean
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
    connectedProviders?: ConnectedProvider[]
  }

  interface User extends DefaultUser {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}