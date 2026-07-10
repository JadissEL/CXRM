'use client';

import React from 'react';
const { useState } = React;
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SocialSignInProps {
  mode: 'sign-in' | 'sign-up';
  role?: 'client' | 'barber';
}

export default function SocialSignIn({ mode, role = 'client' }: SocialSignInProps) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSocialAuth = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    setIsLoading(provider);
    setError('');

    try {
      const authMethod = mode === 'sign-in' ? signIn : signUp;
      
      if (!authMethod) {
        throw new Error('Authentication method not available');
      }

      const redirectUrl = '/dashboard';
      
      if (mode === 'sign-up') {
        await signUp.authenticateWithRedirect({
          strategy: provider,
          redirectUrl,
          redirectUrlComplete: redirectUrl,
          unsafeMetadata: {
            role,
          },
        });
      } else {
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl,
          redirectUrlComplete: redirectUrl,
        });
      }
    } catch (err: any) {
      console.error(`${provider} authentication error:`, err);
      setError(err.errors?.[0]?.message || `Failed to ${mode === 'sign-in' ? 'sign in' : 'sign up'} with ${provider.replace('oauth_', '')}`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Google Sign In */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth('oauth_google')}
        disabled={isLoading !== null}
      >
        {isLoading === 'oauth_google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* Facebook Sign In */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth('oauth_facebook')}
        disabled={isLoading !== null}
      >
        {isLoading === 'oauth_facebook' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        Continue with Facebook
      </Button>

      {/* Apple Sign In */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth('oauth_apple')}
        disabled={isLoading !== null}
      >
        {isLoading === 'oauth_apple' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C8.396 0 8.025.044 8.025.044c0 0-.396.044-.396.044C3.891.088 0 3.979 0 8.017c0 4.624 3.374 8.467 7.8 8.467 1.963 0 3.746-.825 5.017-2.142 1.271 1.317 3.054 2.142 5.017 2.142C22.258 16.484 24 12.641 24 8.017 24 3.979 20.109.088 15.371.044c0 0-.396-.044-.396-.044S15.604 0 12.017 0zm3.963 3.832c1.786 0 3.233 1.447 3.233 3.233s-1.447 3.233-3.233 3.233-3.233-1.447-3.233-3.233 1.447-3.233 3.233-3.233zM8.02 3.832c1.786 0 3.233 1.447 3.233 3.233S9.806 10.298 8.02 10.298s-3.233-1.447-3.233-3.233S6.234 3.832 8.02 3.832z" />
          </svg>
        )}
        Continue with Apple
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}