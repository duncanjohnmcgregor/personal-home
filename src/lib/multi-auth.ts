import { prisma } from '@/lib/prisma'

export type Provider = 'spotify' | 'soundcloud' | 'beatport'

export interface ProviderTokens {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

export interface UserConnections {
  spotify?: ProviderTokens
  soundcloud?: ProviderTokens
  beatport?: ProviderTokens
}

/**
 * Get all connected accounts for a user
 */
export async function getUserConnections(userId: string): Promise<UserConnections> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  })

  const connections: UserConnections = {}

  for (const account of accounts) {
    if (isValidProvider(account.provider)) {
      connections[account.provider as Provider] = {
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
      }
    }
  }

  return connections
}

/**
 * Get tokens for a specific provider for a user
 */
export async function getProviderTokens(
  userId: string,
  provider: Provider
): Promise<ProviderTokens | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  })

  if (!account) {
    return null
  }

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at,
  }
}

/**
 * Check if a user is connected to a specific provider
 */
export async function isProviderConnected(
  userId: string,
  provider: Provider
): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
  })

  return !!account && !!account.access_token
}

/**
 * Get all connected providers for a user
 */
export async function getConnectedProviders(userId: string): Promise<Provider[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true, access_token: true },
  })

  return accounts
    .filter((account: any) => isValidProvider(account.provider) && account.access_token)
    .map((account: any) => account.provider as Provider)
}

/**
 * Disconnect a provider for a user
 */
export async function disconnectProvider(
  userId: string,
  provider: Provider
): Promise<boolean> {
  try {
    const deleted = await prisma.account.deleteMany({
      where: {
        userId,
        provider,
      },
    })

    return deleted.count > 0
  } catch (error) {
    console.error('Error disconnecting provider:', error)
    return false
  }
}

/**
 * Update provider tokens (useful for refresh operations)
 */
export async function updateProviderTokens(
  userId: string,
  provider: Provider,
  tokens: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
): Promise<boolean> {
  try {
    const updated = await prisma.account.updateMany({
      where: {
        userId,
        provider,
      },
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
      },
    })

    return updated.count > 0
  } catch (error) {
    console.error('Error updating provider tokens:', error)
    return false
  }
}

/**
 * Check if a provider string is valid
 */
function isValidProvider(provider: string): provider is Provider {
  const validProviders: string[] = ['spotify', 'soundcloud', 'beatport']
  return validProviders.indexOf(provider) !== -1
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false
  return Date.now() >= expiresAt * 1000
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: Provider): string {
  const names = {
    spotify: 'Spotify',
    soundcloud: 'SoundCloud',
    beatport: 'Beatport',
  }
  return names[provider]
}

/**
 * Get provider icon/color information
 */
export function getProviderInfo(provider: Provider) {
  const info = {
    spotify: {
      name: 'Spotify',
      icon: '🎵',
      color: 'bg-green-500',
      textColor: 'text-white',
    },
    soundcloud: {
      name: 'SoundCloud',
      icon: '☁️',
      color: 'bg-orange-600',
      textColor: 'text-white',
    },
    beatport: {
      name: 'Beatport',
      icon: '🎶',
      color: 'bg-emerald-500',
      textColor: 'text-white',
    },
  }
  return info[provider]
}