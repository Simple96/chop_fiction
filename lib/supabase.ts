import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bbohqxwziavcqiwmcitw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib2hxeHd6aWF2Y3Fpd21jaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDE3NDEsImV4cCI6MjA3MDA3Nzc0MX0.8MepqIP2eLmK6-TNw2JUGqobV_z0IIM9mZZi7kAvYOs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      novels: {
        Row: {
          id: string
          title: string
          author: string
          description: string
          cover_image: string | null
          category: string
          original_language: string
          translated_language: string
          total_chapters: number
          free_chapters: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          description: string
          cover_image?: string | null
          category: string
          original_language?: string
          translated_language?: string
          total_chapters?: number
          free_chapters?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          description?: string
          cover_image?: string | null
          category?: string
          original_language?: string
          translated_language?: string
          total_chapters?: number
          free_chapters?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          novel_id: string
          chapter_number: number
          title: string
          content: string
          is_free: boolean
          created_at: string
        }
        Insert: {
          id?: string
          novel_id: string
          chapter_number: number
          title: string
          content: string
          is_free?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          novel_id?: string
          chapter_number?: number
          title?: string
          content?: string
          is_free?: boolean
          created_at?: string
        }
      }
      user_purchases: {
        Row: {
          id: string
          user_id: string
          novel_id: string
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          novel_id: string
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          novel_id?: string
          purchased_at?: string
        }
      }
      user_bookshelf: {
        Row: {
          id: string
          user_id: string
          novel_id: string
          last_read_chapter: number | null
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          novel_id: string
          last_read_chapter?: number | null
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          novel_id?: string
          last_read_chapter?: number | null
          added_at?: string
        }
      }
    }
  }
} 