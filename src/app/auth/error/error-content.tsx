'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/ui/error-message'

interface ErrorInfo {
  title: string
  description: string
  solutions: string[]
  showRetry: boolean
}

export default function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const error = searchParams.get('error')
  
  const getErrorInfo = (errorType: string | null): ErrorInfo => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          description: 'There was an issue with the authentication setup.',
          solutions: [
            'Check that your Spotify app credentials are properly configured',
            'Ensure the callback URL matches your Spotify app settings',
            'Contact support if the issue persists'
          ],
          showRetry: true
        }
      
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You denied access to your Spotify account or cancelled the authentication.',
          solutions: [
            'Click "Try Again" and approve the permissions when prompted',
            'Make sure you\'re using the correct Spotify account',
            'Check that your Spotify account is in good standing'
          ],
          showRetry: true
        }
      
      case 'Verification':
        return {
          title: 'Verification Failed',
          description: 'We couldn\'t verify your authentication with Spotify.',
          solutions: [
            'Try signing in again',
            'Clear your browser cache and cookies',
            'Make sure you\'re not using a VPN that might interfere',
            'Try using a different browser'
          ],
          showRetry: true
        }
      
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-in Error',
          description: 'There was an error during the OAuth sign-in process.',
          solutions: [
            'Try signing in again',
            'Make sure you\'re using a supported browser',
            'Check your internet connection',
            'Clear browser data and try again'
          ],
          showRetry: true
        }
      
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          description: 'There was an error processing the authentication response from Spotify.',
          solutions: [
            'Try signing in again',
            'Make sure the callback URL is correctly configured',
            'Contact support if this error persists'
          ],
          showRetry: true
        }
      
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Error',
          description: 'We couldn\'t create your account with the provided information.',
          solutions: [
            'Make sure your Spotify account has a valid email address',
            'Try signing in again',
            'Contact support for assistance'
          ],
          showRetry: true
        }
      
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Error',
          description: 'There was an issue with your email during account creation.',
          solutions: [
            'Make sure your Spotify account has a verified email',
            'Check that your email isn\'t already associated with another account',
            'Try signing in again'
          ],
          showRetry: true
        }
      
      case 'Callback':
        return {
          title: 'Callback Error',
          description: 'There was an error processing the authentication callback.',
          solutions: [
            'Try signing in again',
            'Clear your browser cache and cookies',
            'Make sure JavaScript is enabled in your browser'
          ],
          showRetry: true
        }
      
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          description: 'This Spotify account is already associated with a different user.',
          solutions: [
            'Try using a different Spotify account',
            'Sign out of all sessions and try again',
            'Contact support if you believe this is an error'
          ],
          showRetry: false
        }
      
      case 'EmailSignin':
        return {
          title: 'Email Sign-in Error',
          description: 'There was an error with email-based authentication.',
          solutions: [
            'Try using Spotify sign-in instead',
            'Check your email address for typos',
            'Contact support for assistance'
          ],
          showRetry: true
        }
      
      case 'CredentialsSignin':
        return {
          title: 'Credentials Error',
          description: 'Invalid credentials were provided.',
          solutions: [
            'Make sure you\'re using the correct Spotify account',
            'Try signing out of Spotify and signing back in',
            'Clear browser data and try again'
          ],
          showRetry: true
        }
      
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You need to be signed in to access this page.',
          solutions: [
            'Click "Sign In" to authenticate with Spotify',
            'Make sure cookies are enabled in your browser'
          ],
          showRetry: true
        }
      
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication.',
          solutions: [
            'Try signing in again',
            'Clear your browser cache and cookies',
            'Try using a different browser or device',
            'Contact support if the issue persists'
          ],
          showRetry: true
        }
    }
  }

  const errorInfo = getErrorInfo(error)

  const handleRetry = () => {
    router.push('/auth/signin')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <ErrorMessage 
            message={errorInfo.description}
            className="mb-4"
          />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Suggested Solutions:</h3>
            <ul className="space-y-2">
              {errorInfo.solutions.map((solution, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t">
            {errorInfo.showRetry && (
              <Button
                onClick={handleRetry}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Try Signing In Again
              </Button>
            )}
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              Go to Home Page
            </Button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>Error Code:</strong> {error}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                If you continue to experience issues, please include this error code when contacting support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}