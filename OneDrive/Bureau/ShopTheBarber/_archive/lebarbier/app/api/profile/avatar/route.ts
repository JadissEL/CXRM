import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Avatar Upload API Route Handler
 * Handles avatar image upload to Supabase Storage with Clerk sync
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/profile/avatar
 * Upload user avatar image
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

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Delete existing avatar if it exists
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (error) {
      console.warn('Error deleting existing avatar:', error);
      // Continue with upload even if deletion fails
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update Clerk with new avatar URL
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await clerkClient.users.updateUser(userId, {
        profileImageUrl: avatarUrl
      });
    } catch (clerkError) {
      console.error('Error updating Clerk avatar:', clerkError);
      // Continue even if Clerk update fails
    }

    // Update Supabase users table
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('avatar_url')
      .single();

    if (updateError) {
      console.error('Error updating user avatar URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile with new avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove user avatar
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

    // Delete from Supabase Storage
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database update even if storage deletion fails
    }

    // Update Clerk to remove avatar
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await clerkClient.users.updateUser(userId, {
        profileImageUrl: ''
      });
    } catch (clerkError) {
      console.error('Error updating Clerk avatar:', clerkError);
      // Continue even if Clerk update fails
    }

    // Update Supabase users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user avatar URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove avatar from profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}