import { ArrowLeft, CalendarPlus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
  const [dateLabel, setDateLabel] = useState('')
  const total = props.expenses.reduce((sum, item) => sum + item.amount, 0)
  const activeExchanges = props.exchanges.filter((item) => item.eventDateId === selectedDate)
  const giftOptions = props.giftOptions ?? props.expenses.map((expense) => ({ id: expense.id, name: expense.itemName }))
  const reservedCounts = props.reservedCounts ?? props.exchanges.reduce<Record<string, number>>((counts, exchange) => {
    const expenseId = exchange.senderExpenseId ?? props.expenses.find((expense) => expense.itemName === exchange.senderItemText)?.id
    if (expenseId) counts[expenseId] = (counts[expenseId] ?? 0) + 1
    return counts
  }, {})
  const addDate = (event: FormEvent) => { event.preventDefault(); if (!dateLabel.trim()) return; setSelectedDate(props.onAddDate(dateLabel.trim())); setDateLabel('') }
  const deleteDate = (id: string) => { const nextDate = props.dates.find((date) => date.id !== id); props.onDeleteDate(id); if (selectedDate === id) setSelectedDate(nextDate?.id ?? '') }

  return <main className="mx-auto min-h-screen max-w-2xl bg-serenity-50/30 pb-10">
    <header className="sticky top-0 z-10 border-b border-serenity-100 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-2xl items-center gap-3"><button type="button" onClick={props.onBack} className="icon-button text-slate-600" aria-label="回到活動列表"><ArrowLeft /></button><div className="min-w-0"><p className="text-xs font-bold tracking-wider text-rosequartz-600">MY CONCERT</p><h1 className="truncate font-bold text-slate-800">{props.event.title}</h1></div></div></header>
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <ExpenseSection expenses={props.expenses} total={total} reservedCounts={reservedCounts} onAdd={props.onAddExpense} onUpdate={props.onUpdateExpense} onDelete={props.onDeleteExpense} />
      <section className="space-y-3"><div><p className="section-kicker">SHOW DAYS</p><h2 className="section-title">選擇活動日期</h2></div><div className="flex gap-2 overflow-x-auto pb-1">{props.dates.map((date, index) => <div key={date.id} className={`flex shrink-0 overflow-hidden rounded-full ${selectedDate === date.id ? 'bg-serenity-600 text-white shadow-sm' : 'bg-white text-slate-500 ring-1 ring-serenity-200'}`}><button type="button" onClick={() => setSelectedDate(date.id)} className="min-h-11 px-4 text-sm font-bold">{date.dateLabel}</button>{index > 0 && <button type="button" onClick={() => deleteDate(date.id)} className="inline-flex w-9 items-center justify-center border-l border-white/30" aria-label={`刪除 ${date.dateLabel}`}><X size={16} /></button>}</div>)}</div><form onSubmit={addDate} className="flex gap-2"><input type="date" value={dateLabel} onChange={(event) => setDateLabel(event.target.value)} className="field min-w-0 flex-1" /><button className="secondary-button shrink-0"><CalendarPlus size={18} /><span className="hidden sm:inline">新增日期</span><span className="sm:hidden">新增</span></button></form></section>
      {selectedDate ? <ExchangeList exchanges={activeExchanges} giftOptions={giftOptions} onAdd={(draft) => props.onAddExchange(selectedDate, draft)} onUpdate={props.onUpdateExchange} onToggle={props.onToggleExchange} onDelete={props.onDeleteExchange} /> : <div className="rounded-3xl bg-white p-8 text-center text-slate-500">先新增一個活動日期，再建立交換清單。</div>}
    </div>
  </main>
}
