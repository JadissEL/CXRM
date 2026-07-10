import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema for download request
const downloadSchema = z.object({
  token: z.string().min(1, 'Download token is required'),
  id: z.string().uuid('Invalid export ID format'),
});

/**
 * GET /api/profile/download-export
 * 
 * Secure download endpoint for data exports.
 * Validates tokens, checks expiration, and serves files securely.
 * 
 * Security measures:
 * - Validates Clerk JWT token
 * - Verifies download token
 * - Checks export ownership
 * - Enforces expiration times
 * - Logs download attempts
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const id = searchParams.get('id');

    // Validate parameters
    const validatedData = downloadSchema.parse({ token, id });

    // Initialize Supabase client
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

    // Verify the export exists and belongs to the user
    const { data: exportRecord, error: exportError } = await supabase
      .from('privacy_audit')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'data_export')
      .eq('status', 'completed')
      .contains('metadata', { export_id: validatedData.id })
      .order('initiated_at', { ascending: false })
      .limit(1)
      .single();

    if (exportError || !exportRecord) {
      // Log failed download attempt
      await supabase
        .from('privacy_audit')
        .insert({
          user_id: userId,
          action_type: 'data_download',
          status: 'failed',
          request_ip: clientIP,
          user_agent: userAgent,
          error_message: 'Export not found or access denied',
          metadata: {
            export_id: validatedData.id,
            token_provided: !!validatedData.token,
            timestamp: new Date().toISOString()
          }
        });

      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    // Check if export has expired (15 minutes from completion)
    const completedAt = new Date(exportRecord.completed_at!);
    const expirationTime = new Date(completedAt.getTime() + 15 * 60 * 1000); // 15 minutes
    const now = new Date();

    if (now > expirationTime) {
      // Log expired download attempt
      await supabase
        .from('privacy_audit')
        .insert({
          user_id: userId,
          action_type: 'data_download',
          status: 'failed',
          request_ip: clientIP,
          user_agent: userAgent,
          error_message: 'Download link has expired',
          metadata: {
            export_id: validatedData.id,
            completed_at: exportRecord.completed_at,
            expired_at: expirationTime.toISOString(),
            timestamp: new Date().toISOString()
          }
        });

      return NextResponse.json(
        { 
          error: 'Download link has expired',
          expired_at: expirationTime.toISOString(),
          message: 'Please request a new data export'
        },
        { status: 410 }
      );
    }

    // Validate the download token (in a real implementation, you'd store and validate tokens)
    // For this example, we'll use a simple token validation
    const expectedToken = generateDownloadToken(validatedData.id, userId, exportRecord.completed_at!);
    
    if (!crypto.timingSafeEqual(
      Buffer.from(validatedData.token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    )) {
      // Log invalid token attempt
      await supabase
        .from('privacy_audit')
        .insert({
          user_id: userId,
          action_type: 'data_download',
          status: 'failed',
          request_ip: clientIP,
          user_agent: userAgent,
          error_message: 'Invalid download token',
          metadata: {
            export_id: validatedData.id,
            timestamp: new Date().toISOString()
          }
        });

      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 403 }
      );
    }

    // Log successful download attempt
    await supabase
      .from('privacy_audit')
      .insert({
        user_id: userId,
        action_type: 'data_download',
        status: 'completed',
        request_ip: clientIP,
        user_agent: userAgent,
        metadata: {
          export_id: validatedData.id,
          download_timestamp: new Date().toISOString()
        }
      });

    // In a real implementation, you would retrieve the actual file from storage
    // For this example, we'll regenerate the export data
    // Note: In production, you should store the actual files in a secure location
    
    const mockFileContent = JSON.stringify({
      message: 'This is a placeholder for the actual export file',
      export_id: validatedData.id,
      user_id: userId,
      generated_at: exportRecord.initiated_at,
      note: 'In production, this would be the actual ZIP or JSON export file'
    }, null, 2);

    // Set appropriate headers for file download
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="data-export-${validatedData.id}.json"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    return new NextResponse(mockFileContent, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('Download error:', error);
    
    // Try to log the failure
    try {
      const { userId } = auth();
      if (userId) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        await supabase
          .from('privacy_audit')
          .insert({
            user_id: userId,
            action_type: 'data_download',
            status: 'failed',
            request_ip: clientIP,
            user_agent: userAgent,
            error_message: error.message,
            metadata: {
              timestamp: new Date().toISOString()
            }
          });
      }
    } catch (auditError) {
      console.error('Failed to log download failure:', auditError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to download export',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate secure download tokens
 * In production, you should use a more sophisticated token system
 */
function generateDownloadToken(exportId: string, userId: string, completedAt: string): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'fallback-secret-change-in-production';
  const data = `${exportId}:${userId}:${completedAt}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * POST /api/profile/download-export
 * 
 * Generates a new download token for an existing export
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
    const { export_id } = body;

    if (!export_id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the export exists and belongs to the user
    const { data: exportRecord, error: exportError } = await supabase
      .from('privacy_audit')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'data_export')
      .eq('status', 'completed')
      .contains('metadata', { export_id })
      .order('initiated_at', { ascending: false })
      .limit(1)
      .single();

    if (exportError || !exportRecord) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Check if export has expired
    const completedAt = new Date(exportRecord.completed_at!);
    const expirationTime = new Date(completedAt.getTime() + 15 * 60 * 1000);
    const now = new Date();

    if (now > expirationTime) {
      return NextResponse.json(
        { 
          error: 'Export has expired',
          message: 'Please request a new data export'
        },
        { status: 410 }
      );
    }

    // Generate new download token
    const downloadToken = generateDownloadToken(export_id, userId, exportRecord.completed_at!);

    return NextResponse.json({
      download_url: `/api/profile/download-export?token=${downloadToken}&id=${export_id}`,
      expires_at: expirationTime.toISOString(),
      export_id
    });

  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download token' },
      { status: 500 }
    );
  }
}