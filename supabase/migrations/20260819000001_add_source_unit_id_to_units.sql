alter table public.units
add column if not exists source_unit_id text;

create unique index if not exists units_source_unit_id_key on public.units (source_unit_id);
