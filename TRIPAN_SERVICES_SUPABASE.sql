-- TRIPAN V10 — Services database setup
-- Run this in Supabase SQL Editor.
-- This creates the minimum schema expected by the V10 services page.
-- It does NOT require Gemini or Google API keys.

create extension if not exists pgcrypto;

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  name text not null,
  price_range text,
  rating numeric(2,1),
  location text,
  stay_style text,
  review_count integer default 0,
  image_url text,
  maps_url text,
  created_at timestamptz default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  name text not null,
  cuisine text,
  price_range text,
  rating numeric(2,1),
  location text,
  review_count integer default 0,
  image_url text,
  maps_url text,
  created_at timestamptz default now()
);

-- Useful indexes for the Services page destination filter.
create index if not exists hotels_destination_id_idx on public.hotels(destination_id);
create index if not exists restaurants_destination_id_idx on public.restaurants(destination_id);

-- Safe additions if the tables already existed with an older version.
alter table public.hotels add column if not exists price_range text;
alter table public.hotels add column if not exists rating numeric(2,1);
alter table public.hotels add column if not exists location text;
alter table public.hotels add column if not exists stay_style text;
alter table public.hotels add column if not exists review_count integer default 0;
alter table public.hotels add column if not exists image_url text;
alter table public.hotels add column if not exists maps_url text;

alter table public.restaurants add column if not exists cuisine text;
alter table public.restaurants add column if not exists price_range text;
alter table public.restaurants add column if not exists rating numeric(2,1);
alter table public.restaurants add column if not exists location text;
alter table public.restaurants add column if not exists review_count integer default 0;
alter table public.restaurants add column if not exists image_url text;
alter table public.restaurants add column if not exists maps_url text;

-- Prevent accidental duplicate records for the same destination/business name.
create unique index if not exists hotels_destination_name_unique
  on public.hotels(destination_id, lower(name));

create unique index if not exists restaurants_destination_name_unique
  on public.restaurants(destination_id, lower(name));

-- Verification queries:
-- select count(*) from public.hotels;
-- select count(*) from public.restaurants;
-- select d.name, count(h.id) from public.destinations d left join public.hotels h on h.destination_id=d.id group by d.name order by d.name;
-- select d.name, count(r.id) from public.destinations d left join public.restaurants r on r.destination_id=d.id group by d.name order by d.name;
