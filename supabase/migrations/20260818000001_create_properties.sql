create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address text,
  city text,
  region text,
  status text not null default 'Active' check (status in ('Active', 'Needs review', 'Vacant')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_owner_id_idx on public.properties (owner_id);

create or replace function public.set_properties_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_properties_updated_at on public.properties;

create trigger set_properties_updated_at
before update on public.properties
for each row
execute function public.set_properties_updated_at();

alter table public.properties enable row level security;

grant select, insert, update, delete on table public.properties to authenticated;
grant select, insert, update, delete on table public.properties to service_role;

drop policy if exists "Authenticated users can read their own properties" on public.properties;
create policy "Authenticated users can read their own properties"
on public.properties
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can insert their own properties" on public.properties;
create policy "Authenticated users can insert their own properties"
on public.properties
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can update their own properties" on public.properties;
create policy "Authenticated users can update their own properties"
on public.properties
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can delete their own properties" on public.properties;
create policy "Authenticated users can delete their own properties"
on public.properties
for delete
to authenticated
using ((select auth.uid()) = owner_id);
