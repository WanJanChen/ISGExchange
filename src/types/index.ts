export type SocialPlatform = 'instagram' | 'threads'

export interface Event {
  id: string
  title: string
  createdAt: string
  posterImage?: string
}

export interface Expense {
  id: string
  eventId: string
  itemName: string
  amount: number
  note?: string
  itemImage?: string
  amounts?: ExpenseAmount[]
  quantity?: number
}

export interface ExpenseAmount {
  id: string
  label: string
  amount: number
}

export interface EventDate {
  id: string
  eventId: string
  dateLabel: string
}

export interface Exchange {
  id: string
  eventDateId: string
  contactHandle: string
  contactPlatform?: SocialPlatform
  nickname?: string
  receiverItemText: string
  receiverItemImage?: string
  senderItemText: string
  senderExpenseId?: string
  isPrepared: boolean
  isCompleted: boolean
  note?: string
}

export interface ExchangeDraft {
  contact: string
  platform: SocialPlatform
  nickname: string
  receiver: string
  senderExpenseId: string
  note: string
  image?: string
}

export interface AppData {
  events: Event[]
  expenses: Expense[]
  dates: EventDate[]
  exchanges: Exchange[]
}
