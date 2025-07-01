import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Music, ShoppingCart, Users, Zap, X } from 'lucide-react'
import { ConnectButton } from '@/components/connect-button'
import { DisconnectButton } from '@/components/disconnect-button'
import { getUserConnections, getProviderInfo, type Provider } from '@/lib/multi-auth'

export default async function ConnectPlatformsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Get user's connected providers
  const userConnections = await getUserConnections(session.user.id)
  const connectedProviders = Object.keys(userConnections) as Provider[]

  const allPlatforms = [
    {
      id: 'spotify' as Provider,
      name: 'Spotify',
      description: 'Stream music, create playlists, and discover new tracks',
      icon: '🎵',
      color: 'bg-green-500',
      status: 'available',
      features: [
        'Stream millions of songs',
        'Create and share playlists',
        'Discover new music',
        'Access podcast content'
      ],
      comingSoon: false
    },
    {
      id: 'soundcloud' as Provider,
      name: 'SoundCloud',
      description: 'Connect to SoundCloud to discover independent artists and tracks',
      icon: '☁️',
      color: 'bg-orange-600',
      status: 'available',
      features: [
        'Discover independent artists',
        'Stream tracks and playlists',
        'Access user-generated content',
        'Follow artists and creators'
      ],
      comingSoon: false
    },
    {
      id: 'beatport' as Provider,
      name: 'Beatport',
      description: 'Connect to Beatport to access electronic music tracks and purchase songs directly',
      icon: '🎶',
      color: 'bg-emerald-500',
      status: 'available',
      features: [
        'Browse electronic music catalog',
        'Purchase high-quality tracks',
        'Access DJ-friendly formats',
        'Get track metadata and BPM'
      ],
      comingSoon: false
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Connect Platforms
        </h1>
        <p className="text-lg text-gray-600">
          Connect your music platforms to access more content and features
        </p>
      </div>

      {/* Currently Connected Platforms */}
      {connectedProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              Connected Platforms ({connectedProviders.length}/3)
            </CardTitle>
            <CardDescription>
              Platforms you&apos;ve successfully connected to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedProviders.map((providerId) => {
              const platform = allPlatforms.find(p => p.id === providerId)
              const providerInfo = getProviderInfo(providerId)
              
              if (!platform) return null

              return (
                <div key={providerId} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                      <p className="text-sm text-gray-600">Connected as {session.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                    <DisconnectButton provider={platform.name} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Available Platforms to Connect */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {connectedProviders.length === 0 ? 'Available Platforms' : 'Connect More Platforms'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allPlatforms
            .filter(platform => !connectedProviders.includes(platform.id))
            .map((platform) => (
            <Card key={platform.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                      {platform.icon}
                    </div>
                    {platform.name}
                  </CardTitle>
                  {platform.comingSoon && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {platform.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {platform.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t">
                  <ConnectButton 
                    platformName={platform.name}
                    comingSoon={platform.comingSoon}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Music className="w-5 h-5 mr-2" />
            Why Connect Multiple Platforms?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2">
            <li className="flex items-start">
              <ShoppingCart className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Purchase tracks directly from your playlists across different platforms</span>
            </li>
            <li className="flex items-start">
              <Music className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Access a wider variety of music including electronic, independent, and mainstream tracks</span>
            </li>
            <li className="flex items-start">
              <Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Discover new artists and tracks from different music communities</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Sync playlists and transfer music seamlessly between platforms</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {connectedProviders.length > 0 && connectedProviders.length < 3 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <Zap className="w-5 h-5 mr-2" />
              Keep Going! ({connectedProviders.length}/3 Connected)
            </CardTitle>
            <CardDescription className="text-purple-700">
              Connect {3 - connectedProviders.length} more platform{3 - connectedProviders.length > 1 ? 's' : ''} to unlock the full potential of your music library
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Success Card */}
      {connectedProviders.length === 3 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Zap className="w-5 h-5 mr-2" />
              🎉 All Platforms Connected!
            </CardTitle>
            <CardDescription className="text-green-700">
              You&apos;ve connected all three music platforms. You can now enjoy seamless music discovery, playlist management, and purchasing across Spotify, SoundCloud, and Beatport.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}