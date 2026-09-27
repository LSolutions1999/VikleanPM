-- Run once in the Supabase SQL Editor for the existing, empty public.tasks table.
-- The task table already has id and created_at; this adds the fields used by VikleanPM.

alter table public.tasks
  add column if not exists owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  add column if not exists title text not null default '',
  add column if not exists delegation text not null default '',
  add column if not exists description text not null default '',
  add column if not exists deadline_at timestamptz,
  add column if not exists status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  add column if not exists created_by text,
  add column if not exists notes jsonb not null default '[]'::jsonb,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists progress_status text not null default 'To Do' check (progress_status in ('To Do', 'In Progress', 'On Hold')),
  add column if not exists status_log jsonb not null default '[]'::jsonb,
  add column if not exists seen_by text[] not null default '{}',
  add column if not exists completion_date timestamptz,
  add column if not exists cancellation_details jsonb;

create index if not exists tasks_owner_id_created_at_idx on public.tasks (owner_id, created_at desc);

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon, authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks"
  on public.tasks for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete to authenticated
  using ((select auth.uid()) = owner_id);
