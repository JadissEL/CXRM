import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Some features may not work.');
  console.warn('Please create a .env.local file with:');
  console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key');
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and anon key are required! Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

// Only create the client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient() : null; 