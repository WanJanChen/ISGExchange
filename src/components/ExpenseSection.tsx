import { Camera, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { compressImage, createId } from '../lib/storage'
import type { Expense, ExpenseAmount } from '../types'

type AmountDraft = { id: string; label: string; amount: string }
const newAmount = (): AmountDraft => ({ id: createId(), label: '', amount: '' })
const legacyAmounts = (expense: Expense): ExpenseAmount[] => expense.amounts?.length ? expense.amounts : [{ id: 'legacy', label: '', amount: expense.amount }]

interface Props {
  expenses: Expense[]
  total: number
  reservedCounts: Record<string, number>
  onAdd: (name: string, amounts: ExpenseAmount[], note: string, image: string | undefined, quantity: number) => void
  onUpdate: (id: string, name: string, amounts: ExpenseAmount[], note: string, image: string | undefined, quantity: number) => void
  onDelete: (id: string) => void
}

export function ExpenseSection({ expenses, total, reservedCounts, onAdd, onUpdate, onDelete: deleteExpense }: Props) {
  const [name, setName] = useState('')
  const [amounts, setAmounts] = useState<AmountDraft[]>([newAmount()])
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState('')
  const [image, setImage] = useState<string>()
  const [editingId, setEditingId] = useState<string>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const reset = () => { setName(''); setAmounts([newAmount()]); setNote(''); setQuantity(''); setImage(undefined); setEditingId(undefined); setIsFormOpen(false) }
  const chooseImage = async (file?: File) => { if (!file) return; setIsCompressing(true); try { setImage(await compressImage(file)) } finally { setIsCompressing(false) } }
  const submit = (event: FormEvent) => { event.preventDefault(); const rows = amounts.map((row) => ({ id: row.id, label: row.label.trim(), amount: Number(row.amount) })).filter((row) => Number.isFinite(row.amount) && row.amount >= 0); const totalQuantity = Number(quantity); if (!name.trim() || rows.length === 0 || !Number.isInteger(totalQuantity) || totalQuantity < 0) return; if (editingId) onUpdate(editingId, name.trim(), rows, note.trim(), image, totalQuantity); else onAdd(name.trim(), rows, note.trim(), image, totalQuantity); reset() }
  const edit = (expense: Expense) => { setEditingId(expense.id); setName(expense.itemName); setNote(expense.note ?? ''); setQuantity(String(expense.quantity ?? 0)); setImage(expense.itemImage); setAmounts(legacyAmounts(expense).map((row) => ({ id: row.id === 'legacy' ? createId() : row.id, label: row.label, amount: String(row.amount) }))); setIsFormOpen(true) }
  const changeAmount = (id: string, field: keyof Omit<AmountDraft, 'id'>, value: string) => setAmounts((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  const onDelete = (id: string) => {
    const expense = expenses.find((item) => item.id === id)
    if (window.confirm(`確定要刪除「${expense?.itemName ?? '此應援項目'}」嗎？此操作無法復原。`)) deleteExpense(id)
  }

  return <section className="card space-y-4">
    <div className="flex items-center justify-between gap-2"><div><p className="section-kicker">COST TRACKER</p><h2 className="section-title">應援製作項目／成本</h2></div><div className="flex items-center gap-1"><p className="text-lg font-black text-rosequartz-600">NT$ {total.toLocaleString()}</p><button type="button" onClick={() => setIsCollapsed((current) => !current)} className="icon-button text-serenity-600" aria-label={isCollapsed ? '展開製作成本' : '收合製作成本'} aria-expanded={!isCollapsed}>{isCollapsed ? <ChevronDown /> : <ChevronUp />}</button></div></div>
    {!isCollapsed && <>
    {expenses.length > 0 && <ul className="divide-y divide-slate-100">{expenses.map((expense) => { const rows = legacyAmounts(expense); const amount = rows.reduce((sum, row) => sum + row.amount, 0); const reserved = reservedCounts[expense.id] ?? 0; return <li key={expense.id} className="grid grid-cols-[128px_minmax(0,1fr)] gap-3 py-3">{expense.itemImage ? <img src={expense.itemImage} alt={`${expense.itemName} 成品照`} className="h-32 w-32 rounded-2xl object-cover" /> : <div className="h-32 w-32 rounded-2xl bg-serenity-50" />}<div className="min-w-0 pt-1"><div className="flex items-start justify-between gap-1"><p className="min-w-0 flex-1 break-words font-semibold leading-6 text-slate-700">{expense.itemName}</p><div className="flex shrink-0"><button type="button" onClick={() => edit(expense)} className="icon-button text-serenity-600" aria-label="編輯成本"><Pencil size={17} /></button><button type="button" onClick={() => onDelete(expense.id)} className="icon-button text-slate-400" aria-label="刪除成本"><Trash2 size={18} /></button></div></div><div className="mt-1 flex items-center justify-between gap-2"><p className="min-w-0 break-words text-xs text-serenity-700">{rows.map((row) => `${row.label || '未命名項目'} NT$ ${row.amount.toLocaleString()}`).join('・')}</p><p className="shrink-0 text-sm font-bold text-slate-700">NT$ {amount.toLocaleString()}</p></div><p className="mt-2 text-xs font-bold leading-5 text-emerald-700">製作 {expense.quantity ?? 0} ・ 已預約 {reserved} ・ 可現場發放 {Math.max(0, (expense.quantity ?? 0) - reserved)}</p>{expense.note && <p className="mt-1 break-words text-xs text-slate-400">{expense.note}</p>}</div></li> })}</ul>}
    {!isFormOpen && <button type="button" onClick={() => setIsFormOpen(true)} className="secondary-button w-full"><Plus size={18} />新增應援項目</button>}
    {isFormOpen && <form onSubmit={submit} className="space-y-2 rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-700">{editingId ? '編輯應援項目' : '新增應援項目'}</p><button type="button" onClick={reset} className="text-sm text-slate-400">取消</button></div><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="項目名稱，例如：小卡印製" className="field" /><input required min="0" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="製作數量" className="field" /><div className="space-y-2">{amounts.map((row, index) => <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_112px_44px] items-center gap-2"><input value={row.label} onChange={(event) => changeAmount(row.id, 'label', event.target.value)} placeholder={`金額明細 ${index + 1}`} className="field" /><input required min="0" step="1" inputMode="decimal" value={row.amount} onChange={(event) => changeAmount(row.id, 'amount', event.target.value)} placeholder="金額" className="field" />{amounts.length > 1 ? <button type="button" onClick={() => setAmounts((rows) => rows.filter((item) => item.id !== row.id))} className="icon-button text-slate-400" aria-label={`刪除金額明細 ${index + 1}`}><Trash2 size={18} /></button> : <span className="h-11 w-11" aria-hidden="true" />}</div>)}</div><button type="button" onClick={() => setAmounts((rows) => [...rows, newAmount()])} className="secondary-button w-full"><Plus size={18} />新增金額明細</button><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="備註（選填）" className="field" /><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} className="secondary-button w-full"><Camera size={18} />{isCompressing ? '正在壓縮圖片…' : image ? '已選擇成品照，點擊可更換' : '上傳應援物成品照（選填）'}</button>{image && <img src={image} alt="成品照預覽" className="h-36 w-full rounded-2xl object-cover" />}<button className="primary-button w-full">{editingId ? '儲存變更' : '新增'}</button></form>}
    </>}
  </section>
}
