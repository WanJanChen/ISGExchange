alter table public.expenses add column if not exists quantity integer check (quantity >= 0);
alter table public.exchanges add column if not exists sender_expense_id uuid references public.expenses(id) on delete set null;
