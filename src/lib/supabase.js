/**
 * Supabase Client
 * 
 * Connects to your Supabase backend when configured.
 * Falls back gracefully to localStorage when not configured.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client only if configured
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => !!supabase

// Log status for debugging
if (import.meta.env.DEV) {
  if (supabase) {
    console.log('[Manasink] Supabase connected:', supabaseUrl)
  } else {
    console.log('[Manasink] Supabase not configured, using localStorage')
  }
}
