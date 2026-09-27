-- Run once against an existing VikleanPM database before using the updated
-- unit, lease, and multiple-tenant screens.
alter table public.units
  add column if not exists unit_type text not null default '',
  add column if not exists lease_term text not null default 'Standard'
    check (lease_term in ('Standard', 'Monthly')),
  add column if not exists lease_start date,
  add column if not exists lease_end date,
  add column if not exists rent_due_day smallint
    check (rent_due_day between 1 and 31),
  add column if not exists utilities text[] not null default array['Water']::text[];

update public.units
set utilities = array['Water']::text[]
where utilities is null or not ('Water' = any(utilities));

alter table public.tenants
  drop constraint if exists tenants_unit_id_key;

create index if not exists tenants_unit_id_idx on public.tenants (unit_id);
