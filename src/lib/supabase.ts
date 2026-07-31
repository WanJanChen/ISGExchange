import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Publishable keys are intended for browser applications. The legacy anon key
// remains supported here temporarily so existing local .env files still work.
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// 目前 UI 仍使用 localStorage；設定好 .env 後即可在下一階段將 CRUD 換成此 client。
export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

export const isSupabaseConfigured = Boolean(supabase)
