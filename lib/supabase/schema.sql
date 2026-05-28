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
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  title            text not null default 'Untitled',
  content          text not null default '',
  is_pinned        boolean not null default false,
  tags             text[] not null default '{}',
  -- Sharing
  share_token      uuid not null unique default gen_random_uuid(),
  is_public        boolean not null default false,
  public_can_edit  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index documents_user_id_idx    on public.documents(user_id);
create index documents_updated_at_idx on public.documents(updated_at desc);
create index documents_share_token_idx on public.documents(share_token);

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.set_updated_at();

-- ── Collaborators (email-invite based) ───────────────────────────────────────
create table public.document_collaborators (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  invited_by  uuid not null references public.profiles(id),
  email       text not null,
  permission  text not null default 'view' check (permission in ('view', 'edit')),
  created_at  timestamptz not null default now(),
  unique(document_id, email)
);

create index doc_collabs_doc_idx   on public.document_collaborators(document_id);
create index doc_collabs_email_idx on public.document_collaborators(email);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles               enable row level security;
alter table public.documents              enable row level security;
alter table public.document_collaborators enable row level security;

-- Profiles: own row
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Documents: owner has full control
create policy "documents: owner all"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Documents: collaborator can read
create policy "documents: collaborator read"
  on public.documents for select
  using (
    exists (
      select 1 from public.document_collaborators dc
      join public.profiles p on p.email = dc.email
      where dc.document_id = id and p.id = auth.uid()
    )
  );

-- Documents: collaborator with edit permission can update
create policy "documents: collaborator edit"
  on public.documents for update
  using (
    exists (
      select 1 from public.document_collaborators dc
      join public.profiles p on p.email = dc.email
      where dc.document_id = id and p.id = auth.uid() and dc.permission = 'edit'
    )
  )
  with check (
    exists (
      select 1 from public.document_collaborators dc
      join public.profiles p on p.email = dc.email
      where dc.document_id = id and p.id = auth.uid() and dc.permission = 'edit'
    )
  );

-- document_collaborators: owner manages
create policy "dc: owner manages"
  on public.document_collaborators for all
  using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );

-- document_collaborators: collaborator can see their own invites
create policy "dc: view own invites"
  on public.document_collaborators for select
  using (email = (select email from public.profiles where id = auth.uid()));

-- Service role bypass is automatic with service_role key

-- ── Monthly word-conversion reset (cron via pg_cron) ────────────────────────
-- Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
-- Then run:
-- select cron.schedule('reset-word-conversions', '0 0 1 * *',
--   'update public.profiles set word_conversions_this_month = 0');
