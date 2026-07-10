export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          role: 'client' | 'barber' | 'admin'
          avatar_url: string | null
          status: string
          email_verified: boolean
          mfa_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'client' | 'barber' | 'admin'
          avatar_url?: string | null
          status?: string
          email_verified?: boolean
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'client' | 'barber' | 'admin'
          avatar_url?: string | null
          status?: string
          email_verified?: boolean
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          barber_id: string
          client_id: string
          date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          client_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          client_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          category: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          notifications_enabled: boolean
          theme: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notifications_enabled?: boolean
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notifications_enabled?: boolean
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          street: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          street: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          street?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'card' | 'paypal' | 'bank'
          details: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'card' | 'paypal' | 'bank'
          details: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'card' | 'paypal' | 'bank'
          details?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          barber_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          barber_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          barber_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_barber_availability: {
        Args: {
          p_barber_id: string
          p_date: string
          p_service_ids: string[]
          p_start_time?: string | null
          p_end_time?: string | null
        }
        Returns: {
          slot_start: string
          slot_end: string
          is_available: boolean
          total_duration: number
          total_price: number
        }[]
      }
      reserve_time_slot: {
        Args: {
          p_barber_id: string
          p_client_id: string
          p_date: string
          p_start_time: string
          p_end_time: string
          p_service_ids: string[]
          p_duration_minutes: number
        }
        Returns: string // returns reservation ID
      }
    }
    Enums: {
      user_role: 'client' | 'barber' | 'admin'
      appointment_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      theme_preference: 'light' | 'dark' | 'system'
      payment_method_type: 'card' | 'paypal' | 'bank'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
