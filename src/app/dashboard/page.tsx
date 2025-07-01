import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserConnections, getProviderInfo, type Provider } from '@/lib/multi-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Get user's connected providers
  const userConnections = await getUserConnections(session.user.id)
  const connectedProviders = Object.keys(userConnections) as Provider[]

  const getProviderIcon = (provider: Provider) => {
    const icons = {
      spotify: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.5 10.6 1.2.3.2.4.7.0 1.1zm1.3-2.9c-.3.4-.8.5-1.2.2-2.8-1.7-7.1-2.2-10.4-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.8.4 1.4zm.1-3c-3.4-2-9-2.2-12.2-1.2-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.7-1.1 10.1-.9 14 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.5z"/>
        </svg>
      ),
      soundcloud: (
        <div className="w-5 h-5 bg-orange-600 rounded flex items-center justify-center">
          <span className="text-white text-xs">☁️</span>
        </div>
      ),
      beatport: (
        <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
          <span className="text-white text-xs">🎶</span>
        </div>
      ),
    }
    return icons[provider]
  }

  return (
    <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your Music Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            {connectedProviders.length > 0 
              ? `Connected to ${connectedProviders.length} platform${connectedProviders.length > 1 ? 's' : ''}!`
              : 'Connect your music platforms to get started'
            }
          </p>
        </div>

        {/* Connected Platforms */}
        {connectedProviders.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connectedProviders.map((provider) => {
              const providerInfo = getProviderInfo(provider)
              return (
                <Card key={provider}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {getProviderIcon(provider)}
                      <span className="ml-2">{providerInfo.name} Connected</span>
                    </CardTitle>
                    <CardDescription>
                      Your {providerInfo.name} account is successfully linked
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Signed in as: <span className="font-semibold">{session.user?.email}</span>
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Connect More Platforms */}
        {connectedProviders.length < 3 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">
                {connectedProviders.length === 0 ? 'Get Started' : 'Connect More Platforms'}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {connectedProviders.length === 0 
                  ? 'Connect your first music platform to start managing your music library'
                  : `You have ${3 - connectedProviders.length} more platform${3 - connectedProviders.length > 1 ? 's' : ''} to connect`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/connect">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {connectedProviders.length === 0 ? 'Connect Your First Platform' : 'Connect More Platforms'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Playlists</CardTitle>
              <CardDescription>
                Manage your music playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: View and manage your playlists across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Playlists</CardTitle>
              <CardDescription>
                Import playlists from your connected platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: Import playlists from {connectedProviders.length > 0 ? 'your connected platforms' : 'Spotify, SoundCloud, and Beatport'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Sync</CardTitle>
              <CardDescription>
                Sync music across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: Sync your playlists and music across all connected platforms
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>
              Your connected platforms and authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectedProviders.length > 0 ? (
                connectedProviders.map((provider) => {
                  const providerInfo = getProviderInfo(provider)
                  return (
                    <div key={provider} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>✅ {providerInfo.name} connected and ready</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>⚠️ No platforms connected yet</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>✅ Session is active and valid</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>✅ Ready to access connected platform APIs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}