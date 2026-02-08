export type BookStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface BookSettings {
  bg_color: string
  show_download: boolean
  show_page_count: boolean
  auto_flip_seconds: number
}

export interface FlipBook {
  id: string
  slug: string
  user_id: string | null
  title: string
  description: string | null
  pdf_url: string
  pdf_filename: string | null
  pdf_size_bytes: number | null
  page_count: number
  pages_urls: string[]
  status: BookStatus
  error_message: string | null
  settings: BookSettings
  is_public: boolean
  password_hash: string | null
  is_anonymous: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet'

export interface Analytics {
  id: string
  book_id: string
  visitor_ip: string | null
  user_agent: string | null
  referrer: string | null
  country: string | null
  city: string | null
  device_type: DeviceType | null
  pages_viewed: number
  max_page_reached: number
  time_spent_seconds: number
  is_embed: boolean
  embed_domain: string | null
  created_at: string
}

export interface CreateBookInput {
  title?: string
  slug: string
  pdf_url: string
  pdf_filename?: string
  pdf_size_bytes?: number
  user_id?: string | null
  is_anonymous?: boolean
}

export interface ProcessCompleteInput {
  pages_urls: string[]
  page_count: number
}

export interface AnalyticsInput {
  book_id: string
  pages_viewed?: number
  max_page_reached?: number
  time_spent_seconds?: number
  is_embed?: boolean
  embed_domain?: string
}
