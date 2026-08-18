create extension if not exists pgcrypto;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null,
  property_id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  address text,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  rent_amount numeric,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists units_owner_id_idx on public.units (owner_id);
create index if not exists units_property_id_idx on public.units (property_id);

create or replace function public.set_units_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_units_updated_at on public.units;

create trigger set_units_updated_at
before update on public.units
for each row
execute function public.set_units_updated_at();

alter table public.units enable row level security;

grant select, insert, update, delete on table public.units to authenticated;
grant select, insert, update, delete on table public.units to service_role;

drop policy if exists "Authenticated users can read their own units" on public.units;
create policy "Authenticated users can read their own units"
on public.units
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can insert their own units" on public.units;
create policy "Authenticated users can insert their own units"
on public.units
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can update their own units" on public.units;
create policy "Authenticated users can update their own units"
on public.units
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can delete their own units" on public.units;
create policy "Authenticated users can delete their own units"
on public.units
for delete
to authenticated
using ((select auth.uid()) = owner_id);
