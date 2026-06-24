-- =====================================================================
-- FamiTeam — Schéma Supabase (à exécuter dans l'éditeur SQL Supabase)
-- ---------------------------------------------------------------------
-- Comptes (auth.users gérés par Supabase) + familles multi-membres,
-- invitations par lien, état de jeu par famille, et ancrages d'abonnement.
-- Sécurité par RLS : un utilisateur n'accède qu'aux familles dont il est membre.
--
-- Remarque : on n'ajoute volontairement AUCUN trigger sur auth.users
-- (cette table ne nous appartient pas) ; on utilise auth.uid() directement.
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ma famille',
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- Abonnement (préparé pour l'avenir ; Stripe branché plus tard)
  plan text not null default 'free',            -- 'free' | 'premium'
  plan_status text not null default 'active',   -- 'active'|'trialing'|'past_due'|'canceled'
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table if not exists public.family_members (
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'parent',          -- 'owner' | 'parent'
  created_at timestamptz default now(),
  primary key (family_id, user_id)
);
-- Index de passage à l'échelle (milliers de familles) :
-- accélère « quelles familles pour cet utilisateur » et les contrôles RLS.
create index if not exists idx_fm_user on public.family_members(user_id);
create index if not exists idx_families_owner on public.families(owner_id);

create table if not exists public.family_state (
  family_id uuid primary key references public.families(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Historique automatique : à chaque modification de family_state, on archive
-- l'état PRÉCÉDENT (filet de sécurité contre toute perte de données).
create table if not exists public.family_state_history (
  id bigint generated always as identity primary key,
  family_id uuid references public.families(id) on delete cascade,
  data jsonb not null,
  saved_at timestamptz default now()
);
create index if not exists idx_fsh_family on public.family_state_history(family_id, saved_at desc);

create table if not exists public.invites (
  token uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text,                                   -- optionnel : restreindre à un e-mail
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  accepted_at timestamptz
);

-- Administrateurs de l'application (accès à toutes les familles).
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz default now()
);
insert into public.app_admins(email) values ('cedric.dierckx@gmail.com')
  on conflict (email) do nothing;

-- ---------- Fonctions d'accès (évitent la récursion RLS) ----------
create or replace function public.is_family_member(fid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from app_admins where lower(email) = lower(coalesce(auth.email(), '')));
$$;

-- ---------- RLS ----------
alter table public.families        enable row level security;
alter table public.family_members  enable row level security;
alter table public.family_state    enable row level security;
alter table public.invites         enable row level security;
alter table public.app_admins      enable row level security;

drop policy if exists "read my families" on public.families;
create policy "read my families" on public.families
  for select using (is_family_member(id) or owner_id = auth.uid() or is_admin());
drop policy if exists "owner update family" on public.families;
create policy "owner update family" on public.families
  for update using (owner_id = auth.uid() or is_admin());
drop policy if exists "owner delete family" on public.families;
create policy "owner delete family" on public.families
  for delete using (owner_id = auth.uid() or is_admin());

drop policy if exists "read members" on public.family_members;
create policy "read members" on public.family_members
  for select using (is_family_member(family_id) or is_admin());
drop policy if exists "owner manage members" on public.family_members;
create policy "owner manage members" on public.family_members
  for all using (is_admin() or exists(select 1 from families f where f.id = family_id and f.owner_id = auth.uid()))
          with check (is_admin() or exists(select 1 from families f where f.id = family_id and f.owner_id = auth.uid()));

drop policy if exists "members rw state" on public.family_state;
create policy "members rw state" on public.family_state
  for all using (is_family_member(family_id) or is_admin())
          with check (is_family_member(family_id) or is_admin());

alter table public.family_state_history enable row level security;
drop policy if exists "members read history" on public.family_state_history;
create policy "members read history" on public.family_state_history
  for select using (is_family_member(family_id) or is_admin());

-- Déclencheur d'archivage : avant chaque mise à jour de family_state, on
-- enregistre l'ancien état (s'il contenait des enfants) puis on ne conserve
-- que les 40 derniers instantanés par famille.
create or replace function public.snapshot_family_state()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if OLD.data ? 'enfants' and OLD.data -> 'enfants' <> '{}'::jsonb
     and not exists (
       select 1 from family_state_history
       where family_id = OLD.family_id and saved_at > now() - interval '1 hour'
     ) then
    insert into family_state_history(family_id, data) values (OLD.family_id, OLD.data);
    delete from family_state_history h
      where h.family_id = OLD.family_id
        and h.id not in (
          select id from family_state_history
          where family_id = OLD.family_id order by saved_at desc limit 40
        );
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_snapshot_family_state on public.family_state;
create trigger trg_snapshot_family_state
  before update on public.family_state
  for each row execute function public.snapshot_family_state();

drop policy if exists "members read invites" on public.invites;
create policy "members read invites" on public.invites
  for select using (is_family_member(family_id) or is_admin());

drop policy if exists "admins read admins" on public.app_admins;
create policy "admins read admins" on public.app_admins
  for select using (is_admin());

-- ---------- RPC : créer une famille (+ membre owner + état vide) ----------
create or replace function public.create_family(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into families(name, owner_id)
    values (coalesce(nullif(trim(p_name), ''), 'Ma famille'), auth.uid())
    returning id into fid;
  insert into family_members(family_id, user_id, role) values (fid, auth.uid(), 'owner');
  insert into family_state(family_id, data) values (fid, '{}'::jsonb);
  return fid;
end; $$;

-- ---------- RPC : créer une invitation ----------
create or replace function public.create_invite(p_family uuid, p_email text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  insert into invites(family_id, email, created_by)
    values (p_family, nullif(trim(p_email), ''), auth.uid())
    returning token into t;
  return t;
end; $$;

-- ---------- RPC : infos d'une invitation (avant de l'accepter) ----------
create or replace function public.invite_info(p_token uuid)
returns table(family_name text, valid boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select f.name, (i.accepted_at is null and i.expires_at > now())
    from invites i join families f on f.id = i.family_id
    where i.token = p_token;
end; $$;

-- ---------- RPC : accepter une invitation ----------
create or replace function public.accept_invite(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare i invites;
begin
  select * into i from invites where token = p_token;
  if not found then raise exception 'Invitation introuvable'; end if;
  if i.expires_at < now() then raise exception 'Invitation expirée'; end if;
  if i.email is not null and lower(i.email) <> lower(coalesce(auth.email(), '')) then
    raise exception 'Cette invitation est destinée à un autre e-mail';
  end if;
  insert into family_members(family_id, user_id, role)
    values (i.family_id, auth.uid(), 'parent')
    on conflict (family_id, user_id) do nothing;
  update invites set accepted_at = now() where token = p_token and accepted_at is null;
  return i.family_id;
end; $$;

-- ---------- Parrainage : inviter un AMI à créer SA propre famille ----------
-- (différent des invitations qui font rejoindre une famille existante)
create table if not exists public.referrals (
  token uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,    -- parrain
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  accepted_at timestamptz,
  accepted_family uuid references public.families(id) on delete set null       -- filleul
);
-- Index : quotas de parrainage par famille (fenêtre glissante de 7 jours).
create index if not exists idx_referrals_family on public.referrals(family_id, created_at desc);
alter table public.referrals enable row level security;
drop policy if exists "members read referrals" on public.referrals;
create policy "members read referrals" on public.referrals
  for select using (is_family_member(family_id) or is_admin());

-- Quota hebdomadaire restant (3 / semaine ; illimité pour les admins).
-- Invitations/parrainages illimités : plus aucune limite de nombre.
create or replace function public.referral_quota(p_family uuid)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if is_admin() then return 999; end if;
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  return 999;   -- illimité
end; $$;

-- Crée un lien de parrainage (illimité : aucun quota).
create or replace function public.create_referral(p_family uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  insert into referrals(family_id, created_by) values (p_family, auth.uid()) returning token into t;
  return t;
end; $$;

-- Infos d'un parrainage (page d'accueil, avant même d'avoir un compte).
create or replace function public.referral_info(p_token uuid)
returns table(parrain_name text, valid boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select f.name::text, (r.accepted_at is null)
    from referrals r join families f on f.id = r.family_id
    where r.token = p_token;
end; $$;

-- Marque un parrainage comme utilisé (lie la famille filleule).
create or replace function public.claim_referral(p_token uuid, p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update referrals set accepted_at = now(), accepted_family = p_family
    where token = p_token and accepted_at is null;
end; $$;

-- Nombre de filleuls qui ont déjà créé leur famille (pour féliciter le parrain).
create or replace function public.referral_accepted_count(p_family uuid)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  return (select count(*) from referrals
          where family_id = p_family and accepted_at is not null);
end; $$;

-- ---------- Liste d'attente (inscriptions sur invitation uniquement) ----------
create table if not exists public.waitlist (
  email text primary key,
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;
-- Pas de politique SELECT pour le public : on lit la liste via une RPC admin.

-- Rejoindre la liste d'attente (ouvert à tous, même sans compte).
create or replace function public.join_waitlist(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_email), '') = '' then raise exception 'E-mail requis'; end if;
  insert into waitlist(email) values (lower(trim(p_email)))
    on conflict (email) do nothing;
end; $$;

-- RPC admin : consulter la liste d'attente.
create or replace function public.admin_list_waitlist()
returns table(email text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query select w.email::text, w.created_at from waitlist w order by w.created_at;
end; $$;

-- RPC admin : retirer un candidat de la liste d'attente (approuvé ou refusé).
create or replace function public.admin_remove_waitlist(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  delete from waitlist where email = lower(trim(p_email));
end; $$;

-- ---------- RPC admin : lister toutes les familles ----------
create or replace function public.admin_list_families()
returns table(id uuid, name text, plan text, plan_status text,
              members bigint, owner_email text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text, f.plan::text, f.plan_status::text,
      (select count(*) from family_members m where m.family_id = f.id),
      (select u.email::text from auth.users u where u.id = f.owner_id),
      (select s.updated_at from family_state s where s.family_id = f.id)
    from families f
    order by f.created_at;
end; $$;

-- ---------- RPC admin : changer le plan d'une famille ----------
create or replace function public.admin_set_plan(p_family uuid, p_plan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  update families set plan = coalesce(nullif(p_plan, ''), 'free') where id = p_family;
end; $$;

-- ---------- RPC admin : supprimer une famille (et ses données) ----------
create or replace function public.admin_delete_family(p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  delete from families where id = p_family;   -- cascade : membres, état, historique, invites…
end; $$;

-- =====================================================================
-- Évolutions anticipées (additives, ré-exécutables) pour éviter de
-- futures migrations manuelles.
-- =====================================================================

-- ---------- Colonnes d'avenir sur families (non destructives) ----------
alter table public.families add column if not exists locale text;            -- langue préférée
alter table public.families add column if not exists last_seen_at timestamptz; -- dernière activité
alter table public.families add column if not exists archived_at timestamptz;  -- archivage doux (soft-delete)

-- ---------- Retours utilisateurs : bugs & suggestions ----------
-- Stockage centralisé (en plus de l'e-mail) ; lisible par les admins.
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  family_id uuid references public.families(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text not null default 'suggestion',   -- 'bug' | 'suggestion'
  message text not null,
  context jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_feedback_created on public.feedback(created_at desc);
alter table public.feedback enable row level security;
drop policy if exists "insert feedback" on public.feedback;
create policy "insert feedback" on public.feedback
  for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback" on public.feedback
  for select using (is_admin());

-- RPC : enregistrer un retour (bug/suggestion).
create or replace function public.submit_feedback(p_type text, p_message text,
                                                  p_context jsonb default null, p_family uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_message), '') = '' then raise exception 'Message vide'; end if;
  insert into feedback(family_id, user_id, email, type, message, context)
    values (p_family, auth.uid(), auth.email(),
            case when p_type = 'bug' then 'bug' else 'suggestion' end,
            left(p_message, 4000), p_context);
end; $$;

-- RPC admin : consulter les retours.
create or replace function public.admin_list_feedback()
returns table(id bigint, created_at timestamptz, type text, message text, email text, family_id uuid)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query select f.id, f.created_at, f.type::text, f.message, f.email::text, f.family_id
               from feedback f order by f.created_at desc;
end; $$;

-- ---------- Configuration globale de l'app (éditable par les admins) ----------
-- Ex. lien de don Stripe. Lecture publique, écriture réservée aux admins.
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table public.app_config enable row level security;
drop policy if exists "read config" on public.app_config;
create policy "read config" on public.app_config for select using (true);
grant select on public.app_config to anon, authenticated;

create or replace function public.set_app_config(p_key text, p_value text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  insert into app_config(key, value, updated_at) values (p_key, nullif(trim(p_value), ''), now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
end; $$;

-- ---------- Suppression d'un compte famille (propriétaire uniquement) ----------
-- Supprime définitivement la famille et, par cascade (on delete cascade),
-- ses membres, son état de jeu, l'historique, les invitations et parrainages.
create or replace function public.delete_family(p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from families where id = p_family and owner_id = auth.uid()) then
    raise exception 'Accès refusé : seul le propriétaire peut supprimer la famille';
  end if;
  delete from families where id = p_family;
end; $$;

-- ---------- Droits d'exécution ----------
grant execute on function public.create_family(text)            to authenticated;
grant execute on function public.set_app_config(text, text)     to authenticated;grant execute on function public.create_invite(uuid, text)      to authenticated;
grant execute on function public.invite_info(uuid)              to authenticated;
grant execute on function public.accept_invite(uuid)            to authenticated;
grant execute on function public.referral_quota(uuid)           to authenticated;
grant execute on function public.create_referral(uuid)          to authenticated;
grant execute on function public.referral_info(uuid)            to anon, authenticated;
grant execute on function public.claim_referral(uuid, uuid)     to authenticated;
grant execute on function public.referral_accepted_count(uuid)  to authenticated;
grant execute on function public.join_waitlist(text)            to anon, authenticated;
grant execute on function public.admin_list_waitlist()          to authenticated;
grant execute on function public.admin_remove_waitlist(text)    to authenticated;
grant execute on function public.is_admin()                     to authenticated;
grant execute on function public.admin_list_families()          to authenticated;
grant execute on function public.admin_set_plan(uuid, text)     to authenticated;
grant execute on function public.admin_delete_family(uuid)      to authenticated;
grant execute on function public.submit_feedback(text, text, jsonb, uuid) to authenticated;
grant execute on function public.admin_list_feedback()          to authenticated;
grant execute on function public.delete_family(uuid)            to authenticated;

-- ---------- Temps réel sur l'état de jeu (tolérant si déjà activé) ----------
do $$ begin
  alter publication supabase_realtime add table public.family_state;
exception when others then null; end $$;

-- ---------- Recharge le cache de l'API (PostgREST) ----------
notify pgrst, 'reload schema';
