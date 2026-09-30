create table if not exists public.votes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  choice text not null check (choice in ('yes', 'no')),
  created_at timestamptz not null default now()
);

alter table public.votes enable row level security;
revoke all on table public.votes from anon, authenticated;
grant select, insert on table public.votes to authenticated;

drop policy if exists "Users can read their own vote" on public.votes;
create policy "Users can read their own vote"
on public.votes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can submit their own vote" on public.votes;
create policy "Users can submit their own vote"
on public.votes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.get_vote_totals()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'yes', count(*) filter (where choice = 'yes'),
    'no', count(*) filter (where choice = 'no')
  )
  from public.votes;
$$;

revoke all on function public.get_vote_totals() from public, anon, authenticated;
grant execute on function public.get_vote_totals() to anon, authenticated;
