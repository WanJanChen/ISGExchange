import { Camera, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { compressImage, createId } from '../lib/storage'
import type { Expense, ExpenseAmount } from '../types'

type AmountDraft = { id: string; label: string; amount: string }
const newAmount = (): AmountDraft => ({ id: createId(), label: '', amount: '' })
const legacyAmounts = (expense: Expense): ExpenseAmount[] => expense.amounts?.length ? expense.amounts : [{ id: 'legacy', label: '', amount: expense.amount }]

interface Props {
  expenses: Expense[]
  total: number
  onAdd: (name: string, amounts: ExpenseAmount[], note: string, image?: string) => void
  onUpdate: (id: string, name: string, amounts: ExpenseAmount[], note: string, image?: string) => void
  onDelete: (id: string) => void
}

export function ExpenseSection({ expenses, total, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [amounts, setAmounts] = useState<AmountDraft[]>([newAmount()])
  const [note, setNote] = useState('')
  const [image, setImage] = useState<string>()
  const [editingId, setEditingId] = useState<string>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const reset = () => { setName(''); setAmounts([newAmount()]); setNote(''); setImage(undefined); setEditingId(undefined); setIsFormOpen(false) }
  const chooseImage = async (file?: File) => { if (!file) return; setIsCompressing(true); try { setImage(await compressImage(file)) } finally { setIsCompressing(false) } }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const rows = amounts.map((row) => ({ id: row.id, label: row.label.trim(), amount: Number(row.amount) })).filter((row) => Number.isFinite(row.amount) && row.amount >= 0)
    if (!name.trim() || rows.length === 0) return
    if (editingId) onUpdate(editingId, name.trim(), rows, note.trim(), image)
    else onAdd(name.trim(), rows, note.trim(), image)
    reset()
  }
  const edit = (expense: Expense) => { setEditingId(expense.id); setName(expense.itemName); setNote(expense.note ?? ''); setImage(expense.itemImage); setAmounts(legacyAmounts(expense).map((row) => ({ id: row.id === 'legacy' ? createId() : row.id, label: row.label, amount: String(row.amount) }))); setIsFormOpen(true) }
  const changeAmount = (id: string, field: keyof Omit<AmountDraft, 'id'>, value: string) => setAmounts((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))

  return <section className="card space-y-4"><div className="flex items-center justify-between"><div><p className="section-kicker">COST TRACKER</p><h2 className="section-title">製作成本</h2></div><p className="text-lg font-black text-rosequartz-600">NT$ {total.toLocaleString()}</p></div>
    {expenses.length > 0 && <ul className="divide-y divide-slate-100">{expenses.map((expense) => { const rows = legacyAmounts(expense); const amount = rows.reduce((sum, row) => sum + row.amount, 0); return <li key={expense.id} className="flex min-h-16 items-start gap-3 py-3">{expense.itemImage && <img src={expense.itemImage} alt={`${expense.itemName} 成品照`} className="h-12 w-12 shrink-0 rounded-xl object-cover" />}<div className="min-w-0 flex-1 pt-2"><p className="truncate font-semibold text-slate-700">{expense.itemName}</p><p className="mt-1 truncate text-xs text-serenity-700">{rows.map((row) => `${row.label || '未命名項目'} NT$ ${row.amount.toLocaleString()}`).join('・')}</p>{expense.note && <p className="mt-1 truncate text-xs text-slate-400">{expense.note}</p>}</div><p className="flex h-11 shrink-0 items-center font-bold text-slate-700">NT$ {amount.toLocaleString()}</p><button type="button" onClick={() => edit(expense)} className="icon-button text-serenity-600" aria-label="編輯成本"><Pencil size={17} /></button><button type="button" onClick={() => onDelete(expense.id)} className="icon-button text-slate-400" aria-label="刪除成本"><Trash2 size={18} /></button></li> })}</ul>}
    {!isFormOpen && <button type="button" onClick={() => setIsFormOpen(true)} className="secondary-button w-full"><Plus size={18} />新增成本</button>}
    {isFormOpen && <form onSubmit={submit} className="space-y-2 rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-700">{editingId ? '編輯成本項目' : '新增成本項目'}</p><button type="button" onClick={reset} className="text-sm text-slate-400">取消</button></div><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="成本項目名稱，例如：小卡印製" className="field" />
      <div className="space-y-2">{amounts.map((row, index) => <div key={row.id} className="grid grid-cols-[1fr_92px_36px] gap-2"><input value={row.label} onChange={(event) => changeAmount(row.id, 'label', event.target.value)} placeholder={`金額明細 ${index + 1}（可選）`} className="field" /><input required min="0" step="1" inputMode="decimal" value={row.amount} onChange={(event) => changeAmount(row.id, 'amount', event.target.value)} placeholder="金額" className="field" />{amounts.length > 1 ? <button type="button" onClick={() => setAmounts((rows) => rows.filter((item) => item.id !== row.id))} className="icon-button text-slate-400" aria-label="刪除金額明細"><Trash2 size={17} /></button> : <span />}</div>)}</div><button type="button" onClick={() => setAmounts((rows) => [...rows, newAmount()])} className="secondary-button w-full"><Plus size={18} />新增一筆金額明細</button><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="備註（可選）" className="field" /><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} className="secondary-button w-full"><Camera size={18} />{isCompressing ? '正在壓縮成品照…' : image ? '已選擇成品照，點擊可更換' : '上傳應援物成品照（可選）'}</button>{image && <img src={image} alt="成品照預覽" className="h-36 w-full rounded-2xl object-cover" />}<button className="primary-button w-full">{editingId ? '儲存成本變更' : '新增成本'}</button></form>
    }
  </section>
}
