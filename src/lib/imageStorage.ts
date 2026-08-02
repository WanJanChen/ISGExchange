import { supabase } from './supabase'
import { compressImage } from './storage'

const BUCKET = 'support-images'
const STORAGE_PREFIX = 'storage://'
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export function isStoredImage(value?: string): value is string {
  return Boolean(value?.startsWith(STORAGE_PREFIX))
}

export async function uploadImage(file: File, category: 'events' | 'expenses' | 'exchanges'): Promise<string> {
  const compressed = await compressImage(file)
  if (!supabase) return compressed

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('請先登入後再上傳圖片。')

  const response = await fetch(compressed)
  const blob = await response.blob()
  const path = `${user.id}/${category}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return `${STORAGE_PREFIX}${path}`
}

export async function resolveImageUrl(value?: string): Promise<string | undefined> {
  if (!value || !isStoredImage(value)) return value
  if (!supabase) return undefined

  const cached = signedUrlCache.get(value)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const path = value.slice(STORAGE_PREFIX.length)
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error) throw error
  signedUrlCache.set(value, { url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000 })
  return data.signedUrl
}
