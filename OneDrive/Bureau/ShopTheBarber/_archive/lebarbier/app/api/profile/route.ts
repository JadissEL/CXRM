import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Profile API Route Handler
 * Handles CRUD operations for user profiles with Clerk + Supabase sync
 */

// Validation schemas
const updateProfileSchema = z.object({
  // Core fields (synced with Clerk)
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().nullable(),
  
  // Extended fields (Supabase only)
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  preferred_language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  marketing_consent: z.boolean().optional(),
  
  // Address as JSON object
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional()
  }).optional().nullable(),
  
  // Emergency contact as JSON object
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional().nullable()
});

/**
 * GET /api/profile
 * Fetch current user's profile data
 */
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile from Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        *,
        user_preferences(*),
        user_addresses(*),
        user_payment_methods(id, payment_type, last_four, brand, is_default, expires_at),
        user_favorites(
          id,
          favorite_type,
          favorite_id,
          created_at
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update current user's profile data
 * Syncs core fields with Clerk and updates Supabase
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Separate core fields (need Clerk sync) from extended fields
    const coreFields = {
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
      ...(updates.phone !== undefined && { phone: updates.phone })
    };

    const extendedFields = {
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.location !== undefined && { location: updates.location }),
      ...(updates.preferred_language && { preferred_language: updates.preferred_language }),
      ...(updates.timezone && { timezone: updates.timezone }),
      ...(updates.date_of_birth !== undefined && { date_of_birth: updates.date_of_birth }),
      ...(updates.gender !== undefined && { gender: updates.gender }),
      ...(updates.marketing_consent !== undefined && { marketing_consent: updates.marketing_consent }),
      ...(updates.address !== undefined && { address: updates.address }),
      ...(updates.emergency_contact !== undefined && { emergency_contact: updates.emergency_contact })
    };

    // Update Clerk if core fields are being updated
    if (Object.keys(coreFields).length > 0) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        
        const clerkUpdates: any = {};
        if (coreFields.name) {
          const [firstName, ...lastNameParts] = coreFields.name.split(' ');
          clerkUpdates.firstName = firstName;
          clerkUpdates.lastName = lastNameParts.join(' ') || '';
        }
        if (coreFields.email) {
          clerkUpdates.emailAddresses = [{ emailAddress: coreFields.email }];
        }
        if (coreFields.phone !== undefined) {
          clerkUpdates.phoneNumbers = coreFields.phone ? [{ phoneNumber: coreFields.phone }] : [];
        }

        await clerkClient.users.updateUser(userId, clerkUpdates);
      } catch (clerkError) {
        console.error('Error updating Clerk:', clerkError);
        return NextResponse.json(
          { error: 'Failed to update authentication provider' },
          { status: 500 }
        );
      }
    }

    // Update Supabase with all fields
    const allUpdates = { ...coreFields, ...extendedFields, updated_at: new Date().toISOString() };
    
    const { data: updatedProfile, error: supabaseError } = await supabaseAdmin
      .from('users')
      .update(allUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (supabaseError) {
      console.error('Error updating Supabase profile:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile
 * Delete user account and all associated data (GDPR compliance)
 */
export async function DELETE() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete from Supabase first (cascading deletes will handle related data)
    const { error: supabaseError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (supabaseError) {
      console.error('Error deleting from Supabase:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to delete profile data' },
        { status: 500 }
      );
    }

    // Delete from Clerk
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await clerkClient.users.deleteUser(userId);
    } catch (clerkError) {
      console.error('Error deleting from Clerk:', clerkError);
      // Continue even if Clerk deletion fails - user data is already removed from Supabase
    }

    return NextResponse.json({ 
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}