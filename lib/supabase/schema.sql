-- ─────────────────────────────────────────────────────────────────────────────
-- latexci Supabase schema
-- Run this in the Supabase SQL editor: Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────────────
create type subscription_tier as enum ('free', 'pro', 'lab', 'institution');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'unpaid');

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                          uuid primary key references auth.users(id) on delete cascade,
  email                       text not null,
  display_name                text,
  avatar_url                  text,
  stripe_customer_id          text unique,
  subscription_tier           subscription_tier not null default 'free',
  subscription_status         subscription_status,
  subscription_period_end     timestamptz,
  word_conversions_this_month integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── Documents ────────────────────────────────────────────────────────────────
create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null default 'Untitled',
  content    text not null default '',
  is_pinned  boolean not null default false,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents(user_id);
create index documents_updated_at_idx on public.documents(updated_at desc);

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

-- Profiles: users can only read/write their own row
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Documents: users can only CRUD their own documents
create policy "documents: own rows"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypass (used by webhook + admin) is automatic with service_role key

-- ── Monthly word-conversion reset (cron via pg_cron) ────────────────────────
-- Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
-- Then run:
-- select cron.schedule('reset-word-conversions', '0 0 1 * *',
--   'update public.profiles set word_conversions_this_month = 0');
