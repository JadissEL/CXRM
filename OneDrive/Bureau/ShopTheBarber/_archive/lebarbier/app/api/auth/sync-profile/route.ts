import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Profile Sync API Route
 * 
 * Handles synchronization of user profile data between Clerk and Supabase
 * after OAuth sign-in or profile completion.
 */

/**
 * Request body validation schema
 */
const syncProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  updates: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(['client', 'barber']).optional(),
    avatar_url: z.string().url().optional(),
  }),
});

/**
 * POST /api/auth/sync-profile
 * Sync user profile updates to Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = syncProfileSchema.parse(body);

    // Ensure user can only update their own profile
    if (validatedData.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update another user\'s profile' },
        { status: 403 }
      );
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, role, avatar_url')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const updates = validatedData.updates;
    const updateData: any = {};

    // Only update fields that have changed
    if (updates.name && updates.name !== existingUser?.name) {
      updateData.name = updates.name;
    }
    if (updates.phone && updates.phone !== existingUser?.phone) {
      updateData.phone = updates.phone;
    }
    if (updates.role && updates.role !== existingUser?.role) {
      updateData.role = updates.role;
    }
    if (updates.avatar_url && updates.avatar_url !== existingUser?.avatar_url) {
      updateData.avatar_url = updates.avatar_url;
    }

    // If no updates needed, return success
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: 'Profile already up to date',
        user: existingUser
      });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    let result;
    
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new user (shouldn't happen with webhooks, but fallback)
      const newUserData = {
        id: userId,
        name: updates.name || 'User',
        email: '', // Will be updated by webhook
        phone: updates.phone,
        role: updates.role || 'client',
        avatar_url: updates.avatar_url,
        status: 'active',
        email_verified: false,
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(newUserData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      message: 'Profile synced successfully',
      user: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Profile sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sync-profile
 * Check if user profile needs completion
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

    // Get user from Clerk to check what data is available
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerkUser = await clerkClient.users.getUser(userId);

    // Get user from Supabase
    const { data: supabaseUser, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user from Supabase:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Determine missing fields
    const missingFields: string[] = [];

    // Check required fields
    if (!clerkUser.firstName || clerkUser.firstName.trim() === '') {
      missingFields.push('firstName');
    }
    if (!clerkUser.lastName || clerkUser.lastName.trim() === '') {
      missingFields.push('lastName');
    }
    if (!clerkUser.phoneNumbers || clerkUser.phoneNumbers.length === 0) {
      missingFields.push('phone');
    }
    if (!clerkUser.unsafeMetadata?.role || !['client', 'barber'].includes(clerkUser.unsafeMetadata.role as string)) {
      missingFields.push('role');
    }

    const needsCompletion = missingFields.length > 0;

    return NextResponse.json({
      needsCompletion,
      missingFields,
      user: {
        clerk: {
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber,
          role: clerkUser.unsafeMetadata?.role,
          avatar: clerkUser.profileImageUrl,
        },
        supabase: supabaseUser,
      }
    });

  } catch (error) {
    console.error('Profile check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}