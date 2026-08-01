import { readData, saveData } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { AppData, Event, EventDate, Exchange, Expense } from '../types'

type CloudEvent = { id: string; title: string; created_at: string; poster_image: string | null }
type CloudExpense = { id: string; event_id: string; item_name: string; amount: number | string; note: string | null; item_image: string | null; amounts: Expense['amounts'] | null; quantity: number | null }
type CloudDate = { id: string; event_id: string; date_label: string }
type CloudExchange = { id: string; event_date_id: string; contact_handle: string; contact_platform: Exchange['contactPlatform'] | null; nickname: string | null; receiver_item_text: string; receiver_item_image: string | null; sender_item_text: string; sender_expense_id: string | null; sender_expense_ids: string[] | null; is_prepared: boolean; is_completed: boolean; note: string | null }

export async function getSignedInUser() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function signUpWithEmail(email: string, password: string, redirectTo: string) {
  if (!supabase) throw new Error('尚未設定 Supabase 連線資訊。')
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
  if (error) throw error
  return data.session
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('尚未設定 Supabase 連線資訊。')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

async function currentUserId(): Promise<string> {
  if (!supabase) throw new Error('尚未設定 Supabase 連線資訊。')
  const user = await getSignedInUser()
  if (!user) throw new Error('請先以 Email 登入，才能使用雲端同步。')
  return user.id
}

const fromCloud = (events: CloudEvent[], expenses: CloudExpense[], dates: CloudDate[], exchanges: CloudExchange[]): AppData => ({
  events: events.map((item) => ({ id: item.id, title: item.title, createdAt: item.created_at, posterImage: item.poster_image ?? undefined })),
  expenses: expenses.map((item) => ({ id: item.id, eventId: item.event_id, itemName: item.item_name, amount: Number(item.amount), note: item.note ?? undefined, itemImage: item.item_image ?? undefined, amounts: item.amounts ?? undefined, quantity: item.quantity ?? undefined })),
  dates: dates.map((item) => ({ id: item.id, eventId: item.event_id, dateLabel: item.date_label })),
  exchanges: exchanges.map((item) => ({ id: item.id, eventDateId: item.event_date_id, contactHandle: item.contact_handle, contactPlatform: item.contact_platform ?? undefined, nickname: item.nickname ?? undefined, receiverItemText: item.receiver_item_text, receiverItemImage: item.receiver_item_image ?? undefined, senderItemText: item.sender_item_text, senderExpenseId: item.sender_expense_id ?? undefined, senderExpenseIds: item.sender_expense_ids?.length ? item.sender_expense_ids : item.sender_expense_id ? [item.sender_expense_id] : [], isPrepared: item.is_prepared, isCompleted: item.is_completed, note: item.note ?? undefined })),
})

export async function initializeData() {
  const local = readData()
  if (!supabase) return local
  const userId = await currentUserId()
  const [events, expenses, dates, exchanges] = await Promise.all([
    supabase.from('events').select('id,title,created_at,poster_image').eq('user_id', userId),
    supabase.from('expenses').select('id,event_id,item_name,amount,note,item_image,amounts,quantity').eq('user_id', userId),
    supabase.from('event_dates').select('id,event_id,date_label').eq('user_id', userId),
    supabase.from('exchanges').select('id,event_date_id,contact_handle,contact_platform,nickname,receiver_item_text,receiver_item_image,sender_item_text,sender_expense_id,sender_expense_ids,is_prepared,is_completed,note').eq('user_id', userId),
  ])
  const error = events.error || expenses.error || dates.error || exchanges.error
  if (error) throw error
  const cloud = fromCloud(events.data as CloudEvent[], expenses.data as CloudExpense[], dates.data as CloudDate[], exchanges.data as CloudExchange[])
  const cloudIsEmpty = cloud.events.length === 0 && cloud.expenses.length === 0 && cloud.dates.length === 0 && cloud.exchanges.length === 0
  return cloudIsEmpty ? local : cloud
}

function idsForNotIn(ids: string[]) { return `(${ids.map((id) => `"${id}"`).join(',')})` }
async function deleteMissing(table: 'events' | 'expenses' | 'event_dates' | 'exchanges', userId: string, ids: string[]) {
  if (!supabase) return
  let request = supabase.from(table).delete().eq('user_id', userId)
  if (ids.length) request = request.not('id', 'in', idsForNotIn(ids))
  const { error } = await request
  if (error) throw error
}

export async function persistData(data: AppData) {
  saveData(data)
  if (!supabase) return
  const userId = await currentUserId()
  const events = data.events.map((item) => ({ id: item.id, user_id: userId, title: item.title, created_at: item.createdAt, poster_image: item.posterImage ?? null }))
  const dates = data.dates.map((item) => ({ id: item.id, user_id: userId, event_id: item.eventId, date_label: item.dateLabel }))
  const expenses = data.expenses.map((item) => ({ id: item.id, user_id: userId, event_id: item.eventId, item_name: item.itemName, amount: item.amount, note: item.note ?? null, item_image: item.itemImage ?? null, amounts: item.amounts ?? [], quantity: item.quantity ?? null }))
  const exchanges = data.exchanges.map((item) => { const senderExpenseIds = (item.senderExpenseIds ?? (item.senderExpenseId ? [item.senderExpenseId] : [])).filter((id) => data.expenses.some((expense) => expense.id === id)); return { id: item.id, user_id: userId, event_date_id: item.eventDateId, contact_handle: item.contactHandle, contact_platform: item.contactPlatform ?? null, nickname: item.nickname ?? null, receiver_item_text: item.receiverItemText, receiver_item_image: item.receiverItemImage ?? null, sender_item_text: item.senderItemText, sender_expense_id: senderExpenseIds[0] ?? null, sender_expense_ids: senderExpenseIds, is_prepared: item.isPrepared, is_completed: item.isCompleted, note: item.note ?? null } })
  if (events.length) { const { error } = await supabase.from('events').upsert(events); if (error) throw error }
  if (dates.length) { const { error } = await supabase.from('event_dates').upsert(dates); if (error) throw error }
  if (expenses.length) { const { error } = await supabase.from('expenses').upsert(expenses); if (error) throw error }
  if (exchanges.length) { const { error } = await supabase.from('exchanges').upsert(exchanges); if (error) throw error }
  await deleteMissing('exchanges', userId, data.exchanges.map((item) => item.id))
  await deleteMissing('expenses', userId, data.expenses.map((item) => item.id))
  await deleteMissing('event_dates', userId, data.dates.map((item) => item.id))
  await deleteMissing('events', userId, data.events.map((item) => item.id))
}
