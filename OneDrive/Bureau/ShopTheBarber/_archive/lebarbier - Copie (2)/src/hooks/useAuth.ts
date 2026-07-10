'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Profile } from '@/types';
import { auth } from '@/services/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      const currentUser = auth.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    // Small delay to ensure auth service is initialized
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await auth.signIn(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (userData: { name: string; email: string; password: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const result = await auth.signUp(userData);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    setIsLoading(true);
    try {
      const result = await auth.updateProfile(profileData);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check role
  const hasRole = useCallback((role: string) => {
    return auth.hasRole(role);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
  };
} 