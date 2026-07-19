-- Run this once in your Supabase project's SQL Editor (Supabase Dashboard > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- One row per store, one store per logged-in owner
create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  punches_for_reward int not null default 8,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

-- Customers belong to exactly one store
create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  phone text not null,
  birthday date,
  punches int not null default 0,
  rewards_earned int not null default 0,
  last_visit timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (store_id, phone)
);

create index customers_store_id_idx on customers(store_id);

-- Row Level Security: this is what keeps each store's data private
alter table stores enable row level security;
alter table customers enable row level security;

-- A store owner can only see/edit their own store row
create policy "Owners manage their own store"
  on stores for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- A store owner can only see/edit customers that belong to their own store
create policy "Owners manage their own customers"
  on customers for all
  using (
    store_id in (select id from stores where owner_id = auth.uid())
  )
  with check (
    store_id in (select id from stores where owner_id = auth.uid())
  );
