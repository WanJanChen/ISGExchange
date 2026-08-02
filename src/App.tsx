import { Heart, LogOut, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EventCard } from './components/EventCard'
import { EventDetail } from './components/EventDetail'
import { EventForm } from './components/EventForm'
import { createId, readData, saveData } from './lib/storage'
import { isSupabaseConfigured } from './lib/supabase'
import { deleteCloudRecord, getSignedInUser, initializeData, saveCloudDate, saveCloudEvent, saveCloudExchange, saveCloudExpense, signInWithEmail, signOut, signUpWithEmail } from './services/dataService'
import type { AppData, Event as ConcertEvent, EventDate, Exchange, ExchangeDraft, Expense, ExpenseAmount } from './types'

export default function App() {
  const [data, setData] = useState<AppData>(readData)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string>()
  const [notice, setNotice] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => { let active = true; const load = async () => { try { if (isSupabaseConfigured && !(await getSignedInUser())) { if (active) setNeedsLogin(true); return }; const initialData = await initializeData(); if (active) setData(initialData) } catch (error) { if (active) setNotice(`讀取資料失敗：${(error as Error).message}`) } finally { if (active) setIsReady(true) } }; load(); return () => { active = false } }, [])
  useEffect(() => { saveData(data) }, [data])

  useEffect(() => { const updateDate = (event: Event) => { const detail = (event as CustomEvent<{ id: string; label: string }>).detail; if (!detail) return; setData((current) => ({ ...current, dates: current.dates.map((date) => date.id === detail.id ? { ...date, dateLabel: detail.label } : date) })) }; window.addEventListener('update-event-date', updateDate); return () => window.removeEventListener('update-event-date', updateDate) }, [])
  const selected = data.events.find((event) => event.id === selectedEventId)
  const editingEvent = data.events.find((event) => event.id === editingEventId)
  const notify = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2200) }
  const syncCloud = async <T,>(successMessage: string, operation: () => Promise<T>) => {
    setNotice('正在同步至雲端…')
    try {
      const result = await operation()
      notify(successMessage)
      return result
    } catch (error) {
      setNotice(`同步失敗：${(error as Error).message}`)
      throw error
    }
  }
  const eventExpenses = useMemo(() => data.expenses.filter((item) => item.eventId === selectedEventId), [data.expenses, selectedEventId])
  const eventDates = useMemo(() => data.dates.filter((item) => item.eventId === selectedEventId).sort((a, b) => a.dateLabel.localeCompare(b.dateLabel)), [data.dates, selectedEventId])
  const expenseTotal = (expense: { amount: number; amounts?: ExpenseAmount[] }) => expense.amounts?.reduce((sum, row) => sum + row.amount, 0) ?? expense.amount
  useEffect(() => {
    setData((current) => {
      const firstDate = (eventId: string) => current.dates.filter((date) => date.eventId === eventId).map((date) => date.dateLabel).sort()[0]
      const events = [...current.events].sort((a, b) => {
        const aDate = firstDate(a.id)
        const bDate = firstDate(b.id)
        if (!aDate) return bDate ? 1 : 0
        if (!bDate) return -1
        return bDate.localeCompare(aDate)
      })
      return events.every((event, index) => event.id === current.events[index]?.id) ? current : { ...current, events }
    })
  }, [data.dates])

  const addEvent = async (title: string, firstDate: string, posterImage?: string) => {
    const eventItem: ConcertEvent = { id: createId(), title, createdAt: new Date().toISOString(), posterImage }
    const dateItem: EventDate | undefined = firstDate ? { id: createId(), eventId: eventItem.id, dateLabel: firstDate } : undefined
    await syncCloud('活動已建立並同步', async () => { await saveCloudEvent(eventItem); if (dateItem) await saveCloudDate(dateItem) })
    setData((current) => ({ ...current, events: [eventItem, ...current.events], dates: dateItem ? [...current.dates, dateItem] : current.dates }))
    setShowForm(false)
    setSelectedEventId(eventItem.id)
  }
  const updateEvent = async (title: string, firstDate: string, posterImage?: string) => {
    if (!editingEvent) return
    const eventItem: ConcertEvent = { ...editingEvent, title, posterImage }
    const existingDate = data.dates.find((date) => date.eventId === editingEvent.id)
    const dateItem: EventDate | undefined = firstDate ? existingDate ? { ...existingDate, dateLabel: firstDate } : { id: createId(), eventId: editingEvent.id, dateLabel: firstDate } : undefined
    await syncCloud('活動已更新並同步', async () => { await saveCloudEvent(eventItem); if (dateItem) await saveCloudDate(dateItem) })
    setData((current) => ({ ...current, events: current.events.map((event) => event.id === eventItem.id ? eventItem : event), dates: dateItem ? existingDate ? current.dates.map((date) => date.id === dateItem.id ? dateItem : date) : [...current.dates, dateItem] : current.dates }))
    setEditingEventId(undefined)
  }
  const selectedGiftNames = (ids: string[]) => ids.map((id) => data.expenses.find((expense) => expense.id === id)?.itemName).filter(Boolean).join('、')
  const addExchange = async (eventDateId: string, draft: ExchangeDraft) => {
    const item: Exchange = { id: createId(), eventDateId, contactHandle: draft.contact, contactPlatform: draft.platform, nickname: draft.nickname, receiverItemText: draft.receiver, receiverItemImage: draft.image, senderItemText: selectedGiftNames(draft.senderExpenseIds), senderExpenseIds: draft.senderExpenseIds, note: draft.note, isPrepared: false, isCompleted: false }
    await syncCloud('交換夥伴已加入並同步', () => saveCloudExchange(item))
    setData((current) => ({ ...current, exchanges: [...current.exchanges, item] }))
  }
  const updateExchange = async (id: string, draft: ExchangeDraft) => {
    const existing = data.exchanges.find((exchange) => exchange.id === id)
    if (!existing) return
    const item: Exchange = { ...existing, contactHandle: draft.contact, contactPlatform: draft.platform, nickname: draft.nickname, receiverItemText: draft.receiver, receiverItemImage: draft.image, senderItemText: selectedGiftNames(draft.senderExpenseIds), senderExpenseId: undefined, senderExpenseIds: draft.senderExpenseIds, note: draft.note }
    await syncCloud('交換資料已更新並同步', () => saveCloudExchange(item))
    setData((current) => ({ ...current, exchanges: current.exchanges.map((exchange) => exchange.id === id ? item : exchange) }))
  }
  const deleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`確定要刪除「${title}」嗎？相關資料也會一併刪除。`)) return
    const dateIds = data.dates.filter((date) => date.eventId === id).map((date) => date.id)
    await syncCloud('活動已刪除並同步', () => deleteCloudRecord('events', id))
    setData((current) => ({ events: current.events.filter((item) => item.id !== id), expenses: current.expenses.filter((item) => item.eventId !== id), dates: current.dates.filter((item) => item.eventId !== id), exchanges: current.exchanges.filter((item) => !dateIds.includes(item.eventDateId)) }))
  }
  const logOut = async () => {
    try {
      await signOut()
      setData({ events: [], expenses: [], dates: [], exchanges: [] })
      setSelectedEventId(null)
      setEditingEventId(undefined)
      setShowForm(false)
      setPassword('')
      setConfirmPassword('')
      setNeedsLogin(true)
      setNotice('')
    } catch (error) {
      notify(`登出失敗：${(error as Error).message}`)
    }
  }

  if (!isReady) return <main className="flex min-h-screen items-center justify-center bg-serenity-50 text-sm font-bold text-serenity-700">正在讀取資料…</main>
  if (needsLogin) return <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rosequartz-50 via-serenity-50 to-slate-50 p-4"><form onSubmit={async (event) => { event.preventDefault(); if (!email.trim() || !password) return; if (authMode === 'signUp' && password !== confirmPassword) { setNotice('兩次密碼輸入不一致'); return } if (authMode === 'signUp' && password.length < 8) { setNotice('密碼至少需要 8 個字元'); return } setIsAuthenticating(true); try { if (authMode === 'signUp') { const session = await signUpWithEmail(email.trim(), password, window.location.origin); if (!session) { setNotice('請到信箱完成驗證後再登入'); return } } else await signInWithEmail(email.trim(), password); setData(await initializeData()); setNeedsLogin(false); setNotice('登入成功，資料已開始同步') } catch (error) { setNotice(`登入失敗：${(error as Error).message}`) } finally { setIsAuthenticating(false) } }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm"><p className="section-kicker">CLOUD SYNC</p><h1 className="mt-1 text-2xl font-black text-slate-800">{authMode === 'signIn' ? '登入我的應援清單' : '建立雲端帳號'}</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">使用 Email 與密碼同步你的活動資料。</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setAuthMode('signIn'); setNotice('') }} className={`min-h-11 rounded-xl text-sm font-bold ${authMode === 'signIn' ? 'bg-serenity-600 text-white' : 'bg-serenity-50 text-serenity-700'}`}>登入</button><button type="button" onClick={() => { setAuthMode('signUp'); setNotice('') }} className={`min-h-11 rounded-xl text-sm font-bold ${authMode === 'signUp' ? 'bg-serenity-600 text-white' : 'bg-serenity-50 text-serenity-700'}`}>建立帳號</button></div><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="你的 Email" className="field mt-3" /><input required type="password" minLength={8} autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密碼（至少 8 個字元）" className="field mt-3" />{authMode === 'signUp' && <input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次輸入密碼" className="field mt-3" />}{notice && <p className="mt-3 text-sm text-serenity-700">{notice}</p>}<button disabled={isAuthenticating} className="primary-button mt-4 w-full disabled:opacity-60">{isAuthenticating ? '處理中…' : authMode === 'signIn' ? '登入' : '建立帳號'}</button></form></main>
  if (selected) return <EventDetail
    event={selected}
    dates={eventDates}
    expenses={eventExpenses}
    exchanges={data.exchanges.filter((item) => eventDates.some((date) => date.id === item.eventDateId))}
    onBack={() => setSelectedEventId(null)}
    onAddDate={async (dateLabel) => { const item: EventDate = { id: createId(), eventId: selected.id, dateLabel }; await syncCloud('活動日期已新增並同步', () => saveCloudDate(item)); setData((current) => ({ ...current, dates: [...current.dates, item] })); return item.id }}
    onUpdateDate={async (id, dateLabel) => { const existing = data.dates.find((date) => date.id === id); if (!existing) return; const item = { ...existing, dateLabel }; await syncCloud('活動日期已更新並同步', () => saveCloudDate(item)); setData((current) => ({ ...current, dates: current.dates.map((date) => date.id === id ? item : date) })) }}
    onDeleteDate={async (id) => { await syncCloud('日期與當日清單已刪除並同步', () => deleteCloudRecord('event_dates', id)); setData((current) => ({ ...current, dates: current.dates.filter((date) => date.id !== id), exchanges: current.exchanges.filter((exchange) => exchange.eventDateId !== id) })) }}
    onAddExpense={async (itemName, amounts, note, itemImage, quantity) => { const item: Expense = { id: createId(), eventId: selected.id, itemName, amounts, amount: amounts.reduce((sum, row) => sum + row.amount, 0), note, itemImage, quantity }; await syncCloud('成本已新增並同步', () => saveCloudExpense(item)); setData((current) => ({ ...current, expenses: [...current.expenses, item] })) }}
    onUpdateExpense={async (id, itemName, amounts, note, itemImage, quantity) => { const existing = data.expenses.find((expense) => expense.id === id); if (!existing) return; const item: Expense = { ...existing, itemName, amounts, amount: amounts.reduce((sum, row) => sum + row.amount, 0), note, itemImage, quantity }; await syncCloud('成本已更新並同步', () => saveCloudExpense(item)); setData((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? item : expense) })) }}
    onDeleteExpense={async (id) => { await syncCloud('成本已刪除並同步', () => deleteCloudRecord('expenses', id)); setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) })) }}
    onAddExchange={addExchange}
    onUpdateExchange={updateExchange}
    onToggleExchange={async (id, field) => { const existing = data.exchanges.find((item) => item.id === id); if (!existing) return; const item: Exchange = { ...existing, [field]: !existing[field] }; await syncCloud('狀態已更新並同步', () => saveCloudExchange(item)); setData((current) => ({ ...current, exchanges: current.exchanges.map((exchange) => exchange.id === id ? item : exchange) })) }}
    onDeleteExchange={async (id) => { await syncCloud('交換資料已刪除並同步', () => deleteCloudRecord('exchanges', id)); setData((current) => ({ ...current, exchanges: current.exchanges.filter((item) => item.id !== id) })) }}
  />
  return (
    <main className="min-h-screen bg-gradient-to-b from-rosequartz-50 via-serenity-50 to-slate-50">
      <div className="mx-auto max-w-2xl p-4 pb-12 sm:p-6">
        <header className="mb-7 pt-3 sm:pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rosequartz-600">
              <Heart size={20} fill="currentColor" />
              <span className="text-sm font-black tracking-widest">MY SUPPORT KIT</span>
            </div>
            {isSupabaseConfigured && (
              <button type="button" onClick={logOut} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-white" aria-label="登出帳號">
                <LogOut size={18} />登出
              </button>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">演唱會應援禮物交換</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">管理製作成本、交換夥伴與現場發放數量。</p>
        </header>

        {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow-lg">{notice}</div>}

        {editingEvent ? (
          <div className="mb-5">
            <EventForm event={editingEvent} firstDate={data.dates.find((date) => date.eventId === editingEvent.id)?.dateLabel} onSubmit={updateEvent} onCancel={() => setEditingEventId(undefined)} />
          </div>
        ) : showForm ? (
          <div className="mb-5">
            <EventForm onSubmit={addEvent} onCancel={() => setShowForm(false)} />
          </div>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className="primary-button mb-5 w-full">
            <Plus size={20} />建立新活動
          </button>
        )}

        <div className="space-y-4">
          {data.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              total={data.expenses.filter((item) => item.eventId === event.id).reduce((sum, item) => sum + expenseTotal(item), 0)}
              dateCount={data.dates.filter((date) => date.eventId === event.id).length}
              onOpen={() => setSelectedEventId(event.id)}
              onEdit={() => { setEditingEventId(event.id); setShowForm(false) }}
              onDelete={() => deleteEvent(event.id, event.title)}
            />
          ))}
        </div>

        {data.events.length === 0 && !showForm && <div className="mt-10 text-center text-sm text-slate-400">建立第一場活動，開始整理你的應援計畫吧！</div>}
        <p className="mt-8 text-center text-xs text-slate-400">資料會安全地同步至你的 Supabase 雲端帳號。</p>
      </div>
    </main>
  )
}
