-- Add this field to an existing public.properties table before using the
-- Property owner field in the app.
alter table public.properties
  add column if not exists property_owner text;
