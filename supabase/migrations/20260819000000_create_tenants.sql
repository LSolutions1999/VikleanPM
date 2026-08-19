create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null unique,
  property_slug text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  lease_start date,
  lease_end date,
  lease_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_owner_id_idx on public.tenants (owner_id);
create index if not exists tenants_property_slug_idx on public.tenants (property_slug);

create or replace function public.set_tenants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tenants_updated_at on public.tenants;

create trigger set_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_tenants_updated_at();

alter table public.tenants enable row level security;

grant select, insert, update, delete on table public.tenants to authenticated;
grant select, insert, update, delete on table public.tenants to service_role;

drop policy if exists "Authenticated users can read their own tenants" on public.tenants;
create policy "Authenticated users can read their own tenants"
on public.tenants
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can insert their own tenants" on public.tenants;
create policy "Authenticated users can insert their own tenants"
on public.tenants
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can update their own tenants" on public.tenants;
create policy "Authenticated users can update their own tenants"
on public.tenants
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Authenticated users can delete their own tenants" on public.tenants;
create policy "Authenticated users can delete their own tenants"
on public.tenants
for delete
to authenticated
using ((select auth.uid()) = owner_id);
