'use client';

import React from 'react';
const { useState } = React;
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

/**
 * Profile Completion Schema
 * Validates required fields that may be missing after OAuth sign-in
 */
const profileCompletionSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[\+]?[1-9][\d]{0,3}[\s\-]?[\(]?[\d]{1,3}[\)]?[\s\-]?[\d]{1,4}[\s\-]?[\d]{1,4}$/, 'Invalid phone number format'),
  role: z.enum(['client', 'barber'], {
    required_error: 'Please select your role',
  }),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

type ProfileCompletionData = z.infer<typeof profileCompletionSchema>;

interface ProfileCompletionProps {
  missingFields: string[];
  onComplete: () => void;
}

/**
 * ProfileCompletion Component
 * 
 * Prompts users to complete missing profile information after OAuth sign-in.
 * This ensures all required data is collected before allowing access to the app.
 */
export default function ProfileCompletion({ missingFields, onComplete }: ProfileCompletionProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ProfileCompletionData>({
    resolver: zodResolver(profileCompletionSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
      role: undefined,
    },
  });

  const watchedRole = watch('role');

  /**
   * Handle form submission
   * Updates user profile with missing information
   */
  const onSubmit = async (data: ProfileCompletionData) => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Update Clerk user with missing information
      const updatePromises = [];

      // Update name if missing
      if (missingFields.includes('firstName') || missingFields.includes('lastName')) {
        updatePromises.push(
          user.update({
            firstName: data.firstName || user.firstName,
            lastName: data.lastName || user.lastName,
          })
        );
      }

      // Update phone if missing
      if (missingFields.includes('phone') && data.phone) {
        updatePromises.push(
          user.createPhoneNumber({ phoneNumber: data.phone })
        );
      }

      // Update role in unsafe metadata
      if (missingFields.includes('role') && data.role) {
        updatePromises.push(
          user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              role: data.role,
            },
          })
        );
      }

      await Promise.all(updatePromises);

      // Sync updated data to Supabase
      const response = await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          updates: {
            name: `${data.firstName || user.firstName} ${data.lastName || user.lastName}`.trim(),
            phone: data.phone,
            role: data.role,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync profile data');
      }

      setSuccess(true);
      
      // Wait a moment to show success message, then complete
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err: any) {
      console.error('Profile completion error:', err);
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Profile Complete!</h3>
              <p className="text-sm text-gray-600">Redirecting you to the dashboard...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          We need a few more details to set up your account properly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          {missingFields.includes('firstName') && (
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter your first name"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
          )}

          {/* Last Name */}
          {missingFields.includes('lastName') && (
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter your last name"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          )}

          {/* Phone Number */}
          {missingFields.includes('phone') && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          )}

          {/* Role Selection */}
          {missingFields.includes('role') && (
            <div className="space-y-2">
              <Label htmlFor="role">I am a *</Label>
              <Select
                value={watchedRole}
                onValueChange={(value) => setValue('role', value as 'client' | 'barber')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client - Looking for barber services</SelectItem>
                  <SelectItem value="barber">Barber - Providing services</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Profile...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}