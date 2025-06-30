import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your Music Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Successfully connected to Spotify!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.5 10.6 1.2.3.2.4.7.0 1.1zm1.3-2.9c-.3.4-.8.5-1.2.2-2.8-1.7-7.1-2.2-10.4-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.8.4 1.4zm.1-3c-3.4-2-9-2.2-12.2-1.2-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.7-1.1 10.1-.9 14 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.5z"/>
                </svg>
                Spotify Connected
              </CardTitle>
              <CardDescription>
                Your Spotify account is successfully linked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Signed in as: <span className="font-semibold">{session.user?.email}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Playlists</CardTitle>
              <CardDescription>
                Manage your music playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: View and manage your playlists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import from Spotify</CardTitle>
              <CardDescription>
                Import your existing playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: Import playlists from Spotify
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>
              Your authentication is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>✅ Spotify OAuth connected successfully</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>✅ Session is active and valid</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>✅ Ready to access Spotify API</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}