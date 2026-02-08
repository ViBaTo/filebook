export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fb_analytics: {
        Row: {
          book_id: string
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          embed_domain: string | null
          id: string
          is_embed: boolean | null
          max_page_reached: number | null
          pages_viewed: number | null
          referrer: string | null
          time_spent_seconds: number | null
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          book_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          embed_domain?: string | null
          id?: string
          is_embed?: boolean | null
          max_page_reached?: number | null
          pages_viewed?: number | null
          referrer?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          book_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          embed_domain?: string | null
          id?: string
          is_embed?: boolean | null
          max_page_reached?: number | null
          pages_viewed?: number | null
          referrer?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fb_analytics_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'fb_books'
            referencedColumns: ['id']
          }
        ]
      }
      fb_books: {
        Row: {
          created_at: string | null
          description: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          is_anonymous: boolean | null
          is_public: boolean | null
          page_count: number | null
          pages_urls: Json | null
          password_hash: string | null
          pdf_filename: string | null
          pdf_size_bytes: number | null
          pdf_url: string
          settings: Json | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          page_count?: number | null
          pages_urls?: Json | null
          password_hash?: string | null
          pdf_filename?: string | null
          pdf_size_bytes?: number | null
          pdf_url: string
          settings?: Json | null
          slug: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          page_count?: number | null
          pages_urls?: Json | null
          password_hash?: string | null
          pdf_filename?: string | null
          pdf_size_bytes?: number | null
          pdf_url?: string
          settings?: Json | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fb_subscriptions: {
        Row: {
          advanced_analytics: boolean | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          custom_domain: boolean | null
          id: string
          max_file_size_mb: number
          max_flipbooks: number
          max_pages_per_book: number
          password_protection: boolean | null
          plan: string
          premium_credits: number | null
          remove_watermark: boolean | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          advanced_analytics?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          custom_domain?: boolean | null
          id?: string
          max_file_size_mb?: number
          max_flipbooks?: number
          max_pages_per_book?: number
          password_protection?: boolean | null
          plan?: string
          premium_credits?: number | null
          remove_watermark?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          advanced_analytics?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          custom_domain?: boolean | null
          id?: string
          max_file_size_mb?: number
          max_flipbooks?: number
          max_pages_per_book?: number
          password_protection?: boolean | null
          plan?: string
          premium_credits?: number | null
          remove_watermark?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          created_at: string | null
          default_plan: string | null
          description: string | null
          is_active: boolean | null
          is_free_by_default: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_plan?: string | null
          description?: string | null
          is_active?: boolean | null
          is_free_by_default?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_plan?: string | null
          description?: string | null
          is_active?: boolean | null
          is_free_by_default?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_product_access: {
        Row: {
          activated_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          plan: string
          product_code: string
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          product_code: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          product_code?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_product_access_product_code_fkey'
            columns: ['product_code']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['code']
          }
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: { Args: { product: string }; Returns: string }
      has_product_access: {
        Args: { product: string; required_plan?: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Row']

export type TablesInsert<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Insert']

export type TablesUpdate<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Update']
