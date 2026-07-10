import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for account deletion request
const deleteAccountSchema = z.object({
  confirmationText: z.string().min(1, 'Confirmation text is required'),
  password: z.string().optional(), // For additional verification if needed
  reason: z.string().optional(),
});

/**
 * DELETE /api/profile/delete-account
 * 
 * Permanently deletes a user's account and all associated data.
 * Requires authentication and confirmation.
 * 
 * Security measures:
 * - Validates Clerk JWT token
 * - Requires explicit confirmation
 * - Logs all actions for audit
 * - Cascades deletion across all related data
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // Verify confirmation text
    if (validatedData.confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation text. Please type "DELETE MY ACCOUNT" exactly.' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get client IP and user agent for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the deletion attempt
    const { error: auditError } = await supabase
      .from('privacy_audit')
      .insert({
        user_id: userId,
        action_type: 'account_deletion',
        status: 'initiated',
        request_ip: clientIP,
        user_agent: userAgent,
        metadata: {
          reason: validatedData.reason,
          confirmation_provided: true,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Failed to log deletion attempt:', auditError);
    }

    // Check for pending operations that might block deletion
    const { data: pendingOperations, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check user data: ${checkError.message}`);
    }

    // Update audit log to in_progress
    await supabase
      .from('privacy_audit')
      .update({ status: 'in_progress' })
      .eq('user_id', userId)
      .eq('action_type', 'account_deletion')
      .eq('status', 'initiated');

    // Cascade delete all user data from Supabase
    const { error: cascadeError } = await supabase
      .rpc('cascade_delete_user_data', { target_user_id: userId });

    if (cascadeError) {
      // Log the failure
      await supabase
        .from('privacy_audit')
        .update({ 
          status: 'failed',
          error_message: cascadeError.message,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('action_type', 'account_deletion')
        .eq('status', 'in_progress');

      throw new Error(`Failed to delete user data: ${cascadeError.message}`);
    }

    // Delete user from Clerk
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (clerkError: any) {
      console.error('Failed to delete user from Clerk:', clerkError);
      
      // Log the partial failure
      await supabase
        .from('privacy_audit')
        .update({ 
          status: 'failed',
          error_message: `Clerk deletion failed: ${clerkError.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('action_type', 'account_deletion')
        .eq('status', 'in_progress');

      return NextResponse.json(
        { 
          error: 'Account deletion partially failed. Please contact support.',
          details: 'User data was deleted but authentication provider cleanup failed.'
        },
        { status: 500 }
      );
    }

    // Final audit log update
    await supabase
      .from('privacy_audit')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('action_type', 'account_deletion')
      .eq('status', 'in_progress');

    return NextResponse.json(
      { 
        success: true,
        message: 'Account successfully deleted. You will be logged out shortly.'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Account deletion error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete account',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/delete-account
 * 
 * Returns information about account deletion requirements and pending operations.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check for any pending operations or data that might affect deletion
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check user profile: ${error.message}`);
    }

    // Get recent audit logs for this user
    const { data: recentAudits } = await supabase
      .from('privacy_audit')
      .select('action_type, status, initiated_at')
      .eq('user_id', userId)
      .order('initiated_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      canDelete: true,
      userProfile: userProfile || null,
      recentAudits: recentAudits || [],
      requirements: {
        confirmationText: 'DELETE MY ACCOUNT',
        requiresReauth: true,
        dataRetentionPeriod: '30 days for audit logs only'
      }
    });

  } catch (error: any) {
    console.error('Error checking deletion requirements:', error);
    return NextResponse.json(
      { error: 'Failed to check deletion requirements' },
      { status: 500 }
    );
  }
}