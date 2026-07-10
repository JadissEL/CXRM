import { createClient } from '@supabase/supabase-js';
export { createClient };
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Types for our database tables
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

// Helper functions for user management
export async function createUserProfile(userData: UserInsert) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
}

export async function updateUserMFAStatus(userId: string, mfaEnabled: boolean) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ mfa_enabled: mfaEnabled })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating MFA status:', error);
    throw error;
  }

  return data;
}

// Check if user is banned or unverified
export async function checkUserStatus(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('status, email_verified')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking user status:', error);
    return { isBanned: false, isVerified: true };
  }

  return {
    isBanned: data.status === 'banned',
    isVerified: data.email_verified || false,
  };
}
