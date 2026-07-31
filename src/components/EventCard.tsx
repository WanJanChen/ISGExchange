import { CalendarDays, ChevronRight, Pencil, ReceiptText, Trash2 } from 'lucide-react'
import type { Event } from '../types'

interface Props {
  event: Event
  total: number
  dateCount: number
  onOpen: () => void
  onDelete: () => void
  onEdit: () => void
}

export function EventCard({ event, total, dateCount, onOpen, onDelete, onEdit }: Props) {
  return <article className="relative overflow-hidden rounded-3xl border border-rosequartz-100 bg-white p-5 shadow-sm">
    {event.posterImage && <><div className="absolute inset-0 bg-cover bg-center opacity-[0.32]" style={{ backgroundImage: `url(${event.posterImage})` }} /><div className="absolute inset-0 bg-white/58" /></>}
    <button type="button" onClick={onOpen} className="relative block w-full text-left">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><p className="mb-1 text-xs font-bold tracking-wider text-rosequartz-600">CONCERT PROJECT</p><h2 className="text-lg font-bold leading-snug text-slate-800">{event.title}</h2></div>
        <ChevronRight className="mt-1 shrink-0 text-slate-500" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-rosequartz-50/90 p-3"><ReceiptText size={18} className="mb-1 text-rosequartz-600" /><p className="text-xs text-slate-600">應援總成本</p><p className="font-bold text-slate-800">NT$ {total.toLocaleString()}</p></div>
        <div className="rounded-2xl bg-serenity-50/90 p-3"><CalendarDays size={18} className="mb-1 text-serenity-600" /><p className="text-xs text-slate-600">活動場次</p><p className="font-bold text-slate-800">{dateCount} 天</p></div>
      </div>
    </button>
    <div className="relative mt-4 flex items-center justify-end gap-2"><button type="button" onClick={onEdit} className="icon-button text-serenity-700" aria-label="編輯活動" title="編輯活動"><Pencil size={18} /></button><button type="button" onClick={onDelete} className="icon-button text-slate-500" aria-label="刪除此活動" title="刪除此活動"><Trash2 size={18} /></button></div>
  </article>
}
