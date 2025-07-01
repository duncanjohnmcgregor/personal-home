import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Music, ShoppingCart, Users, Zap } from 'lucide-react'

export default async function ConnectPlatformsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const platforms = [
    {
      name: 'Beatport',
      description: 'Connect to Beatport to access electronic music tracks and purchase songs directly',
      icon: '🎵',
      color: 'bg-orange-500',
      status: 'coming_soon',
      features: [
        'Browse electronic music catalog',
        'Purchase high-quality tracks',
        'Access DJ-friendly formats',
        'Get track metadata and BPM'
      ],
      comingSoon: true
    },
    {
      name: 'SoundCloud',
      description: 'Connect to SoundCloud to discover independent artists and tracks',
      icon: '☁️',
      color: 'bg-orange-600',
      status: 'coming_soon',
      features: [
        'Discover independent artists',
        'Stream tracks and playlists',
        'Access user-generated content',
        'Follow artists and creators'
      ],
      comingSoon: true
    }
  ]

  const handleConnect = (platformName: string) => {
    // This will be implemented when the OAuth flows are set up
    console.log(`Connecting to ${platformName}...`)
  }

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-green-500" />
            Connected Platforms
          </CardTitle>
          <CardDescription>
            Platforms you&apos;ve successfully connected to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.5 10.6 1.2.3.2.4.7.0 1.1zm1.3-2.9c-.3.4-.8.5-1.2.2-2.8-1.7-7.1-2.2-10.4-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.8.4 1.4zm.1-3c-3.4-2-9-2.2-12.2-1.2-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.7-1.1 10.1-.9 14 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Spotify</h3>
                <p className="text-sm text-gray-600">Connected as {session.user?.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Available Platforms */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Platforms
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {platforms.map((platform) => (
            <Card key={platform.name} className="relative">
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
                  {platform.comingSoon ? (
                    <Button 
                      disabled 
                      className="w-full"
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(platform.name)}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect {platform.name}
                    </Button>
                  )}
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
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}