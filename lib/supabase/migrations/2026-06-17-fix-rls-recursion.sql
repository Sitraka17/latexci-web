-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: "infinite recursion detected in policy for relation documents"
--
-- Cause: the "documents: collaborator read/edit" policies query
-- document_collaborators, and the "dc: owner manages" policy queries documents
-- → a mutual RLS cycle Postgres rejects, blocking every read/insert on documents.
--
-- Fix: move the cross-table checks into SECURITY DEFINER functions. They run as
-- the function owner, so RLS is NOT re-applied to the inner table → no cycle.
--
-- Safe to run multiple times. Paste into Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Helper functions (SECURITY DEFINER → bypass RLS on the tables they read)

create or replace function public.owns_document(doc_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.documents
    where id = doc_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_collaborator(doc_id uuid, require_edit boolean default false)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.document_collaborators dc
    join public.profiles p on p.email = dc.email
    where dc.document_id = doc_id
      and p.id = auth.uid()
      and (not require_edit or dc.permission = 'edit')
  );
$$;

-- 2. Rewrite the recursive policies to use the functions

drop policy if exists "documents: collaborator read" on public.documents;
create policy "documents: collaborator read"
  on public.documents for select
  using (public.is_collaborator(id));

drop policy if exists "documents: collaborator edit" on public.documents;
create policy "documents: collaborator edit"
  on public.documents for update
  using (public.is_collaborator(id, true))
  with check (public.is_collaborator(id, true));

drop policy if exists "dc: owner manages" on public.document_collaborators;
create policy "dc: owner manages"
  on public.document_collaborators for all
  using (public.owns_document(document_id))
  with check (public.owns_document(document_id));

-- The "documents: owner all", "profiles: own row", and "dc: view own invites"
-- policies are not recursive and are left unchanged.
