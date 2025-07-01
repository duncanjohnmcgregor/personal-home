'use client'

import { useEffect, useState } from 'react'
import { signIn, signOut, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Session } from 'next-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'

export default function SignInContent() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  useEffect(() => {
    async function checkSession() {
      try {
        const currentSession = await getSession()
        setSession(currentSession)
        
        // If user is already authenticated and no error, redirect to dashboard
        if (currentSession && !errorParam) {
          router.push(callbackUrl)
          return
        }
        
        // Handle errors from URL params
        if (errorParam) {
          switch (errorParam) {
            case 'AccessDenied':
              setError('Access was denied. Please make sure you approve the Spotify permissions.')
              break
            case 'Configuration':
              setError('There was a configuration error. Please try again.')
              break
            case 'Verification':
              setError('Unable to verify your account. Please try signing in again.')
              break
            default:
              setError('An authentication error occurred. Please try again.')
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Unable to check authentication status. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [errorParam, callbackUrl, router])

  const handleSpotifySignIn = async () => {
    setIsSigningIn(true)
    setError(null)
    
    try {
      const result = await signIn('spotify', {
        callbackUrl,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Failed to sign in with Spotify. Please try again.')
      } else if (result?.url) {
        // Redirect to the callback URL
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await signOut({ redirect: false })
      setSession(null)
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    // Clear URL parameters and retry
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
    handleSpotifySignIn()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <LoadingSpinner />
            <span className="ml-2">Checking authentication...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.5 10.6 1.2.3.2.4.7.0 1.1zm1.3-2.9c-.3.4-.8.5-1.2.2-2.8-1.7-7.1-2.2-10.4-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.8.4 1.4zm.1-3c-3.4-2-9-2.2-12.2-1.2-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.7-1.1 10.1-.9 14 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.5z"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">
            Music Playlist Manager
          </CardTitle>
          <CardDescription>
            {session ? 
              'You are already signed in. Choose an option below.' :
              'Connect your Spotify account to get started'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <ErrorMessage 
              message={error}
              className="mb-4"
            />
          )}

          {session ? (
            // Already authenticated - show options
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Signed in as: <span className="font-semibold">{session.user?.email}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => router.push(callbackUrl)}
                  className="w-full"
                  variant="default"
                >
                  Continue to Dashboard
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  Sign Out & Try Different Account
                </Button>
              </div>
            </div>
          ) : (
            // Not authenticated - show sign in options
            <div className="space-y-4">
              <Button
                onClick={handleSpotifySignIn}
                disabled={isSigningIn}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isSigningIn ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Connecting to Spotify...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.5 10.6 1.2.3.2.4.7.0 1.1zm1.3-2.9c-.3.4-.8.5-1.2.2-2.8-1.7-7.1-2.2-10.4-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.8.4 1.4zm.1-3c-3.4-2-9-2.2-12.2-1.2-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.7-1.1 10.1-.9 14 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.5z"/>
                    </svg>
                    Sign in with Spotify
                  </div>
                )}
              </Button>

              {error && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                  disabled={isSigningIn}
                >
                  Try Again
                </Button>
              )}
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>
              By signing in, you agree to allow this app to access your Spotify playlists and manage them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}