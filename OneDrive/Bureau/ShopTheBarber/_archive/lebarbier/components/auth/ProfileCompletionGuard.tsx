'use client';

import React from 'react';
const { useEffect, useState } = React;
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import ProfileCompletion from './ProfileCompletion';
import { Loader2 } from 'lucide-react';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

interface ProfileCheckResponse {
  needsCompletion: boolean;
  missingFields: string[];
  user: {
    clerk: any;
    supabase: any;
  };
}

/**
 * ProfileCompletionGuard Component
 * 
 * Checks if the authenticated user has completed their profile after OAuth sign-in.
 * If required fields are missing, shows the ProfileCompletion component.
 * Otherwise, renders the children components.
 */
export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [profileStatus, setProfileStatus] = useState<ProfileCheckResponse | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');

  // Routes that should bypass profile completion check
  const bypassRoutes = [
    '/sign-in',
    '/sign-up',
    '/api',
    '/profile-completion',
  ];

  const shouldBypass = bypassRoutes.some(route => pathname.startsWith(route));

  /**
   * Check if user profile needs completion
   */
  const checkProfileCompletion = async () => {
    if (!user || shouldBypass) {
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/sync-profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check profile status');
      }

      const data: ProfileCheckResponse = await response.json();
      setProfileStatus(data);
    } catch (err: any) {
      console.error('Profile check error:', err);
      setError(err.message || 'Failed to check profile status');
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Handle profile completion
   */
  const handleProfileComplete = () => {
    setProfileStatus(prev => prev ? { ...prev, needsCompletion: false } : null);
    // Redirect to dashboard or intended destination
    router.push('/dashboard');
  };

  // Check profile completion when user loads
  useEffect(() => {
    if (isLoaded) {
      checkProfileCompletion();
    }
  }, [isLoaded, user, pathname]);

  // Show loading state while checking
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-600">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => {
              setError('');
              setIsChecking(true);
              checkProfileCompletion();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no user or should bypass, render children
  if (!user || shouldBypass) {
    return <>{children}</>;
  }

  // If profile needs completion, show completion form
  if (profileStatus?.needsCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <ProfileCompletion
          missingFields={profileStatus.missingFields}
          onComplete={handleProfileComplete}
        />
      </div>
    );
  }

  // Profile is complete, render children
  return <>{children}</>;
}