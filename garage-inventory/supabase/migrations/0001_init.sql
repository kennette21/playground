-- Garage inventory schema. Apply with `supabase db push` or paste into the SQL editor.

create table if not exists public.locations (
  id          uuid primary key,
  code        text not null unique,
  name        text not null,
  kind        text not null check (kind in ('area','container','drawer','shelf','bin','other')),
  parent_id   uuid references public.locations(id) on delete cascade,
  description text not null default '',
  sort_order  integer not null default 0,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.items (
  id          uuid primary key,
  name        text not null,
  category    text not null default '',
  quantity    numeric not null default 1,
  unit        text not null default '',
  tags        text[] not null default '{}',
  notes       text not null default '',
  location_id uuid references public.locations(id) on delete set null,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.item_events (
  id               uuid primary key,
  item_id          uuid not null references public.items(id) on delete cascade,
  type             text not null check (type in ('created','moved','updated','quantity','removed','checked')),
  from_location_id uuid references public.locations(id) on delete set null,
  to_location_id   uuid references public.locations(id) on delete set null,
  note             text not null default '',
  at               timestamptz not null default now()
);

create index if not exists items_location_idx on public.items(location_id);
create index if not exists item_events_item_idx on public.item_events(item_id, at);
create index if not exists locations_parent_idx on public.locations(parent_id);

-- Full-text search helper (the app also searches client-side).
alter table public.items
  add column if not exists search tsvector
  generated always as (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(category,'') || ' ' ||
                coalesce(array_to_string(tags,' '),'') || ' ' || coalesce(notes,''))
  ) stored;
create index if not exists items_search_idx on public.items using gin(search);

-- Row level security: any signed-in user of this project gets full access.
-- This is a single-household app; tighten to per-user rows if you ever share the project.
alter table public.locations   enable row level security;
alter table public.items       enable row level security;
alter table public.item_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['locations','items','item_events'] loop
    execute format('drop policy if exists "authenticated full access" on public.%I', t);
    execute format(
      'create policy "authenticated full access" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Optional: public bucket for drawer / item photos.
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;
drop policy if exists "authenticated upload photos" on storage.objects;
create policy "authenticated upload photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
drop policy if exists "public read photos" on storage.objects;
create policy "public read photos" on storage.objects
  for select using (bucket_id = 'photos');
