import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// Webhook secret from Clerk Dashboard
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

// Handle user creation
async function handleUserCreated(userData: any) {
  const {
    id,
    email_addresses,
    first_name,
    last_name,
    phone_numbers,
    unsafe_metadata,
    email_verification_status,
    external_accounts,
    profile_image_url,
  } = userData;

  const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id);
  const primaryPhone = phone_numbers.find((phone: any) => phone.id === userData.primary_phone_number_id);
  
  const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';
  const email = primaryEmail?.email_address;
  const phone = primaryPhone?.phone_number;
  const role = unsafe_metadata?.role || 'client';
  const emailVerified = email_verification_status === 'verified';
  const avatarUrl = profile_image_url;

  if (!email) {
    throw new Error('No email address found for user');
  }

  // Extract OAuth provider information
  const oauthProviders = extractOAuthProviders(external_accounts);

  // Check for existing user with same email (account linking)
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser && existingUser.id !== id) {
    console.log(`Account linking detected: existing user ${existingUser.id}, new user ${id}`);
    // In a real implementation, you might want to merge accounts or handle this differently
    // For now, we'll update the existing user's OAuth provider info
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        ...oauthProviders,
        avatar_url: avatarUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('Error updating existing user with OAuth info:', updateError);
    }
    return;
  }

  // Create user in Supabase
  const { error } = await supabaseAdmin
    .from('users')
    .insert({
      id,
      name,
      email,
      phone,
      role,
      email_verified: emailVerified,
      mfa_enabled: false,
      status: 'active',
      avatar_url: avatarUrl,
      ...oauthProviders,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error creating user in Supabase:', error);
    throw error;
  }

  console.log(`User created in Supabase: ${id}`);
}

// Handle user updates
async function handleUserUpdated(userData: any) {
  const {
    id,
    email_addresses,
    first_name,
    last_name,
    phone_numbers,
    unsafe_metadata,
    email_verification_status,
    external_accounts,
    profile_image_url,
    banned,
    locked,
  } = userData;

  // Check if user should be blocked
  if (shouldBlockUser(userData)) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        status: 'banned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating user status to banned:', error);
    } else {
      console.log(`User ${id} status updated to banned`);
    }
    return;
  }

  const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id);
  const primaryPhone = phone_numbers.find((phone: any) => phone.id === userData.primary_phone_number_id);
  
  const name = `${first_name || ''} ${last_name || ''}`.trim();
  const email = primaryEmail?.email_address;
  const phone = primaryPhone?.phone_number;
  const role = unsafe_metadata?.role;
  const emailVerified = email_verification_status === 'verified';
  const avatarUrl = profile_image_url;

  // Extract OAuth provider information
  const oauthProviders = extractOAuthProviders(external_accounts);

  const updates: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (role) updates.role = role;
  if (emailVerified !== undefined) updates.email_verified = emailVerified;
  if (avatarUrl) updates.avatar_url = avatarUrl;
  
  // Add OAuth provider IDs
  Object.assign(updates, oauthProviders);

  // Update user in Supabase
  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating user in Supabase:', error);
    throw error;
  }

  console.log(`User updated in Supabase: ${id}`);
}

// Handle user deletion
async function handleUserDeleted(userData: any) {
  const { id } = userData;

  // Delete user from Supabase (cascade will handle related records)
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }

  console.log(`User deleted from Supabase: ${id}`);
}

// Handle session creation (sync MFA status)
async function handleSessionCreated(sessionData: any) {
  const { user_id } = sessionData;

  // Get user's MFA status from Clerk and sync to Supabase
  // This would require additional Clerk API calls to get MFA status
  // For now, we'll just log the session creation
  console.log(`Session created for user: ${user_id}`);
}

/**
 * Extract OAuth provider information from external accounts
 */
function extractOAuthProviders(externalAccounts: any[] = []) {
  const providers: any = {};

  externalAccounts.forEach((account: any) => {
    const { provider, provider_user_id } = account;
    
    switch (provider) {
      case 'google':
        providers.google_id = provider_user_id;
        break;
      case 'facebook':
        providers.facebook_id = provider_user_id;
        break;
      case 'apple':
        providers.apple_id = provider_user_id;
        break;
      default:
        console.log(`Unknown OAuth provider: ${provider}`);
    }
  });

  return providers;
}

/**
 * Check if user is banned or has restricted status
 */
function shouldBlockUser(userData: any): boolean {
  // Check if user has been banned or has restricted status
  const { banned, locked } = userData;
  
  if (banned || locked) {
    return true;
  }

  // Additional checks can be added here
  // e.g., check against a blocklist, verify email domain, etc.
  
  return false;
}