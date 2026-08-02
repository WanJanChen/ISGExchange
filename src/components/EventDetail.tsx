import { ArrowLeft, CalendarPlus, Check, Pencil, Trash2, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import type { Event, EventDate, Exchange, ExchangeDraft, Expense, ExpenseAmount } from '../types'
import { ExchangeList } from './ExchangeList'
import { ExpenseSection } from './ExpenseSection'

interface Props {
  event: Event
  dates: EventDate[]
  expenses: Expense[]
  exchanges: Exchange[]
  reservedCounts?: Record<string, number>
  giftOptions?: { id: string; name: string }[]
  onBack: () => void
  onAddDate: (label: string) => string
  onUpdateDate?: (id: string, label: string) => void
  onDeleteDate: (id: string) => void
  onAddExpense: (name: string, amounts: ExpenseAmount[], note: string, image: string | undefined, quantity: number) => void
  onUpdateExpense: (id: string, name: string, amounts: ExpenseAmount[], note: string, image: string | undefined, quantity: number) => void
  onDeleteExpense: (id: string) => void
  onAddExchange: (dateId: string, draft: ExchangeDraft) => void
  onUpdateExchange: (id: string, draft: ExchangeDraft) => void
  onToggleExchange: (id: string, field: 'isPrepared' | 'isCompleted') => void
  onDeleteExchange: (id: string) => void
}

export function EventDetail(props: Props) {
  const [selectedDate, setSelectedDate] = useState(props.dates[0]?.id ?? '')
  const [isAdding, setIsAdding] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [editingId, setEditingId] = useState<string>()
  const [editingDate, setEditingDate] = useState('')
  const [error, setError] = useState('')
  const addDateInputRef = useRef<HTMLInputElement>(null)

  const total = props.expenses.reduce((sum, item) => sum + item.amount, 0)
  const exchanges = props.exchanges
    .filter((item) => item.eventDateId === selectedDate)
    .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted))
  const gifts = props.giftOptions ?? props.expenses.map((item) => ({ id: item.id, name: item.itemName }))
  const reserved = props.reservedCounts ?? props.exchanges.reduce<Record<string, number>>((counts, exchange) => {
    const ids = exchange.senderExpenseIds ?? (exchange.senderExpenseId ? [exchange.senderExpenseId] : [])
    ids.forEach((id) => { counts[id] = (counts[id] ?? 0) + 1 })
    return counts
  }, {})

  const duplicate = (value: string, ignoreId?: string) =>
    props.dates.some((item) => item.id !== ignoreId && item.dateLabel === value)

  const openAddDate = () => {
    setIsAdding(true)
    setNewDate('')
    setEditingId(undefined)
    setError('')
    window.setTimeout(() => {
      const input = addDateInputRef.current
      input?.focus()
      try { input?.showPicker?.() } catch { /* focus still opens the native picker on supported mobile browsers */ }
    }, 0)
  }

  const addDate = (event: FormEvent) => {
    event.preventDefault()
    if (!newDate) {
      setError('請先選擇日期。')
      return
    }
    if (duplicate(newDate)) {
      setError('此日期已經存在。')
      return
    }
    setSelectedDate(props.onAddDate(newDate))
    setNewDate('')
    setIsAdding(false)
    setError('')
  }

  const startEditing = (date: EventDate) => {
    setEditingId(date.id)
    setEditingDate(date.dateLabel)
    setIsAdding(false)
    setError('')
  }

  const cancelEditing = () => {
    setEditingId(undefined)
    setEditingDate('')
    setError('')
  }

  const saveEditedDate = (id: string) => {
    if (!editingDate) {
      setError('請先選擇日期。')
      return
    }
    if (duplicate(editingDate, id)) {
      setError('此日期已經存在。')
      return
    }
    if (props.onUpdateDate) props.onUpdateDate(id, editingDate)
    else window.dispatchEvent(new CustomEvent('update-event-date', { detail: { id, label: editingDate } }))
    cancelEditing()
  }

  const deleteDate = (id: string) => {
    if (props.dates.length <= 1 || !window.confirm('確定要刪除此活動日期嗎？當日交換資料也會一併刪除。')) return
    const next = props.dates.find((item) => item.id !== id)
    props.onDeleteDate(id)
    if (selectedDate === id) setSelectedDate(next?.id ?? '')
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-serenity-50/30 pb-10">
      <header className="sticky top-0 z-10 border-b border-serenity-100 bg-white/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" onClick={props.onBack} className="icon-button text-slate-600" aria-label="返回活動列表"><ArrowLeft /></button>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-rosequartz-600">MY CONCERT</p>
            <h1 className="truncate font-bold text-slate-800">{props.event.title}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <ExpenseSection expenses={props.expenses} total={total} reservedCounts={reserved} onAdd={props.onAddExpense} onUpdate={props.onUpdateExpense} onDelete={props.onDeleteExpense} />

        <section className="space-y-3">
          <div>
            <p className="section-kicker">SHOW DAYS</p>
            <h2 className="section-title">選擇活動日期</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {props.dates.map((date) => (
              <div key={date.id} className={`flex shrink-0 overflow-hidden rounded-full ${selectedDate === date.id ? 'bg-serenity-600 text-white' : 'bg-white text-slate-500 ring-1 ring-serenity-200'}`}>
                {editingId === date.id ? (
                  <>
                    <input autoFocus type="date" value={editingDate} onChange={(event) => { setEditingDate(event.target.value); setError('') }} className="h-11 bg-transparent px-3 text-sm outline-none" aria-label="編輯活動日期" />
                    <button type="button" onClick={() => saveEditedDate(date.id)} className="inline-flex min-h-11 w-11 items-center justify-center border-l border-white/30" aria-label="儲存日期"><Check size={17} /></button>
                    <button type="button" onClick={cancelEditing} className="inline-flex min-h-11 w-11 items-center justify-center border-l border-white/30" aria-label="取消編輯日期"><X size={17} /></button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setSelectedDate(date.id)} className="min-h-11 px-4 text-sm font-bold">{date.dateLabel}</button>
                    <button type="button" onClick={() => startEditing(date)} className="inline-flex min-h-11 w-11 items-center justify-center border-l border-white/30" aria-label={`編輯 ${date.dateLabel}`}><Pencil size={15} /></button>
                    <button type="button" disabled={props.dates.length <= 1} onClick={() => deleteDate(date.id)} className="inline-flex min-h-11 w-11 items-center justify-center border-l border-white/30 disabled:opacity-35" aria-label={`刪除 ${date.dateLabel}`}><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm font-semibold text-rosequartz-700">{error}</p>}

          {isAdding ? (
            <form onSubmit={addDate} className="flex flex-wrap gap-2">
              <input ref={addDateInputRef} required type="date" value={newDate} onChange={(event) => { setNewDate(event.target.value); setError('') }} className="field min-w-44 flex-1" />
              <button className="primary-button">儲存</button>
              <button type="button" onClick={() => { setIsAdding(false); setNewDate(''); setError('') }} className="secondary-button">取消</button>
            </form>
          ) : (
            <button type="button" onClick={openAddDate} className="secondary-button"><CalendarPlus size={18} />新增日期</button>
          )}
        </section>

        {selectedDate && (
          <ExchangeList
            exchanges={exchanges}
            giftOptions={gifts}
            onAdd={(draft) => props.onAddExchange(selectedDate, draft)}
            onUpdate={props.onUpdateExchange}
            onToggle={props.onToggleExchange}
            onDelete={(id) => { if (window.confirm('確定要刪除此交換資料嗎？')) props.onDeleteExchange(id) }}
          />
        )}
      </div>
    </main>
  )
}
