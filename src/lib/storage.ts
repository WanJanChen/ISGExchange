import type { AppData } from '../types'

const STORAGE_KEY = 'idol-support-gift-exchange-data'

const emptyData: AppData = { events: [], expenses: [], dates: [], exchanges: [] }

export function readData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyData, ...JSON.parse(raw) } : emptyData
  } catch {
    return emptyData
  }
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'QuotaExceededError') throw error
    const lightweight: AppData = {
      events: data.events.map(({ posterImage, ...event }) => ({ ...event, posterImage: posterImage?.startsWith('storage://') ? posterImage : undefined })),
      expenses: data.expenses.map(({ itemImage, ...expense }) => ({ ...expense, itemImage: itemImage?.startsWith('storage://') ? itemImage : undefined })),
      dates: data.dates,
      exchanges: data.exchanges.map(({ receiverItemImage, ...exchange }) => ({ ...exchange, receiverItemImage: receiverItemImage?.startsWith('storage://') ? receiverItemImage : undefined })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight))
  }
}

export function createId() {
  return crypto.randomUUID()
}

export async function compressImage(file: File): Promise<string> {
  const source = await URL.createObjectURL(file)
  const image = new Image()
  image.src = source
  await image.decode()
  const longestEdge = 1000
  const scale = Math.min(1, longestEdge / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(source)
  return canvas.toDataURL('image/jpeg', 0.74)
}
