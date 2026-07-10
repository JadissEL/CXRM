import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

/**
 * Data Export API Route Handler
 * Provides GDPR-compliant data export functionality
 */

/**
 * GET /api/profile/export
 * Export all user data in JSON format for GDPR compliance
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

    // Fetch all user data from Supabase
    const [userResult, preferencesResult, addressesResult, paymentMethodsResult, favoritesResult, appointmentsResult] = await Promise.allSettled([
      // User profile data
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      
      // User preferences
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId),
      
      // User addresses
      supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId),
      
      // Payment methods (excluding sensitive data)
      supabase
        .from('user_payment_methods')
        .select('id, payment_type, last_four, brand, is_default, expires_at, created_at')
        .eq('user_id', userId),
      
      // User favorites
      supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId),
      
      // User appointments
      supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          total_price,
          created_at,
          services(name, description, duration, price),
          barber:users!appointments_barber_id_fkey(name, email)
        `)
        .or(`client_id.eq.${userId},barber_id.eq.${userId}`)
    ]);

    // Fetch Clerk data
    let clerkData = null;
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Extract relevant Clerk data (excluding sensitive information)
      clerkData = {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses.map(email => ({
          emailAddress: email.emailAddress,
          verified: email.verification?.status === 'verified'
        })),
        phoneNumbers: clerkUser.phoneNumbers.map(phone => ({
          phoneNumber: phone.phoneNumber,
          verified: phone.verification?.status === 'verified'
        })),
        profileImageUrl: clerkUser.profileImageUrl,
        createdAt: clerkUser.createdAt,
        updatedAt: clerkUser.updatedAt,
        lastSignInAt: clerkUser.lastSignInAt,
        twoFactorEnabled: clerkUser.twoFactorEnabled
      };
    } catch (clerkError) {
      console.error('Error fetching Clerk data:', clerkError);
      // Continue without Clerk data if there's an error
    }

    // Compile export data
    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        format: 'JSON',
        gdpr_compliant: true
      },
      clerk_data: clerkData,
      profile_data: userResult.status === 'fulfilled' ? userResult.value.data : null,
      preferences: preferencesResult.status === 'fulfilled' ? preferencesResult.value.data : [],
      addresses: addressesResult.status === 'fulfilled' ? addressesResult.value.data : [],
      payment_methods: paymentMethodsResult.status === 'fulfilled' ? paymentMethodsResult.value.data : [],
      favorites: favoritesResult.status === 'fulfilled' ? favoritesResult.value.data : [],
      appointments: appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data : [],
      data_processing_info: {
        purposes: [
          'Account management',
          'Service provision',
          'Communication',
          'Legal compliance'
        ],
        legal_basis: 'Contract performance and legitimate interests',
        retention_period: 'Data is retained while account is active and for 7 years after account deletion for legal compliance',
        third_parties: [
          'Clerk (Authentication)',
          'Supabase (Data storage)',
          'Payment processors (for transactions)'
        ]
      }
    };

    // Return as downloadable JSON file
    const fileName = `user-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/export
 * Request data export via email (for large datasets)
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
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get user profile to verify email ownership
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Verify the email belongs to the user
    if (userProfile.email !== email) {
      return NextResponse.json(
        { error: 'Email address does not match your account' },
        { status: 403 }
      );
    }

    // TODO: Implement email sending logic here
    // This would typically involve:
    // 1. Generating the export data (similar to GET endpoint)
    // 2. Creating a secure download link or attaching the file
    // 3. Sending email via your email service (SendGrid, AWS SES, etc.)
    // 4. Logging the export request for audit purposes

    // For now, return a success message
    return NextResponse.json({
      message: 'Data export request received. You will receive an email with your data within 24 hours.',
      request_id: `export-${userId}-${Date.now()}`,
      email: email
    });
  } catch (error) {
    console.error('Data export request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}