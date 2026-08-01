alter table public.exchanges
  add column if not exists sender_expense_ids uuid[] not null default '{}';

update public.exchanges
set sender_expense_ids = array[sender_expense_id]
where sender_expense_id is not null
  and cardinality(sender_expense_ids) = 0;
