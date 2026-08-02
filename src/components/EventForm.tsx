import { Camera } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { uploadImage } from '../lib/imageStorage'
import type { Event } from '../types'
import { StoredImage } from './StoredImage'

interface Props {
  event?: Event
  firstDate?: string
  onSubmit: (title: string, firstDate: string, posterImage?: string) => void
  onCancel?: () => void
}

export function EventForm({ event, firstDate = '', onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [date, setDate] = useState(firstDate)
  const [posterImage, setPosterImage] = useState<string | undefined>(event?.posterImage)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTitle(event?.title ?? ''); setDate(firstDate); setPosterImage(event?.posterImage) }, [event, firstDate])
  const choosePoster = async (file?: File) => { if (!file) return; setIsCompressing(true); try { setPosterImage(await uploadImage(file, 'events')) } finally { setIsCompressing(false) } }
  const editing = Boolean(event)
  return <form onSubmit={(formEvent) => { formEvent.preventDefault(); if (title.trim()) onSubmit(title.trim(), date, posterImage) }} className="space-y-3 rounded-3xl border border-dashed border-rosequartz-300 bg-rosequartz-50/60 p-4">
    <label className="block text-sm font-bold text-slate-700">{editing ? '編輯演唱會活動' : '新增一場演唱會'}</label>
    <input required value={title} onChange={(inputEvent) => setTitle(inputEvent.target.value)} placeholder="例如：2026 SEVENTEEN TOUR in Kaohsiung" className="field" />
    <label className="block text-sm font-medium text-slate-600">參與的第一天演唱會日期<input type="date" value={date} onChange={(inputEvent) => setDate(inputEvent.target.value)} className="field mt-1" /></label>
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(inputEvent) => choosePoster(inputEvent.target.files?.[0])} />
    <button type="button" onClick={() => fileRef.current?.click()} className="secondary-button w-full"><Camera size={18} />{isCompressing ? '正在壓縮海報…' : posterImage ? '已選擇海報，點擊可更換' : '上傳演唱會海報（選填）'}</button>
    {posterImage && <StoredImage src={posterImage} alt="演唱會海報預覽" className="h-36 w-full rounded-2xl object-cover" />}
    <div className="grid grid-cols-2 gap-2"><button className={`primary-button ${onCancel ? '' : 'col-span-2'}`}>{editing ? '儲存活動變更' : '建立活動'}</button>{onCancel && <button type="button" onClick={onCancel} className="min-h-11 rounded-xl bg-white text-sm font-medium text-slate-500 ring-1 ring-slate-200">取消</button>}{editing && <button type="button" onClick={() => setPosterImage(undefined)} className="col-span-2 min-h-11 text-sm font-medium text-slate-500">移除海報</button>}</div>
  </form>
}
