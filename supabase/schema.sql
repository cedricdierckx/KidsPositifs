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
-- La signature a gagné un paramètre `p_source` : on supprime l'ancienne pour
-- éviter toute ambiguïté de résolution côté PostgREST.
drop function if exists public.create_family(text);
create or replace function public.create_family(p_name text, p_source text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into families(name, owner_id, source)
    values (coalesce(nullif(trim(p_name), ''), 'Ma famille'), auth.uid(),
            left(nullif(trim(coalesce(p_source, '')), ''), 60))
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
drop function if exists public.join_waitlist(text);
create or replace function public.join_waitlist(p_email text, p_source text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_email), '') = '' then raise exception 'E-mail requis'; end if;
  insert into waitlist(email, source)
    values (lower(trim(p_email)), left(nullif(trim(coalesce(p_source, '')), ''), 60))
    on conflict (email) do nothing;
end; $$;

-- RPC admin : consulter la liste d'attente.
drop function if exists public.admin_list_waitlist();
create or replace function public.admin_list_waitlist()
returns table(email text, created_at timestamptz, source text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query select w.email::text, w.created_at, w.source::text from waitlist w order by w.created_at;
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
-- STATISTIQUES D'UTILISATION (admin, lecture seule)
-- ---------------------------------------------------------------------
-- Toutes ces fonctions sont en LECTURE SEULE (aucune écriture) et
-- réservées aux administrateurs. Elles n'exposent aucune donnée
-- nominative d'enfant : uniquement des agrégats.
-- =====================================================================

-- ---------- RPC admin : agrégats globaux (une seule ligne JSON) ----------
-- Chiffres clés : familles (total / nouvelles 7-30 j), membres, enfants,
-- familles actives (1/7/30 j via family_state.updated_at), répartition des
-- plans, parrainages acceptés, liste d'attente, retours utilisateurs.
create or replace function public.admin_stats()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'familles_total',       (select count(*) from families),
    'familles_7j',          (select count(*) from families where created_at >= now() - interval '7 days'),
    'familles_30j',         (select count(*) from families where created_at >= now() - interval '30 days'),
    'membres_total',        (select count(*) from family_members),
    'enfants_total',        coalesce((select sum((select count(*) from jsonb_object_keys(s.data -> 'enfants')))
                                       from family_state s
                                       where jsonb_typeof(s.data -> 'enfants') = 'object'), 0),
    'actives_1j',           (select count(*) from family_state where updated_at >= now() - interval '1 day'),
    'actives_7j',           (select count(*) from family_state where updated_at >= now() - interval '7 days'),
    'actives_30j',          (select count(*) from family_state where updated_at >= now() - interval '30 days'),
    'plan_free',            (select count(*) from families where plan = 'free'),
    'plan_premium',         (select count(*) from families where plan = 'premium'),
    'referrals_acceptes',   (select count(*) from referrals where accepted_at is not null),
    'waitlist_total',       (select count(*) from waitlist),
    'feedback_total',       (select count(*) from feedback),
    'feedback_bugs',        (select count(*) from feedback where type = 'bug'),
    'feedback_suggestions', (select count(*) from feedback where type = 'suggestion'),
    'feedback_non_lus',     (select count(*) from feedback where status = 'nouveau')
  ) into resultat;
  return resultat;
end; $$;

-- ---------- RPC admin : inscriptions par semaine (26 dernières) ----------
create or replace function public.admin_series_inscriptions()
returns table(semaine date, n integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select date_trunc('week', f.created_at)::date as semaine, count(*)::int as n
    from families f
    where f.created_at >= date_trunc('week', now()) - interval '25 weeks'
    group by 1 order by 1;
end; $$;

-- ---------- RPC admin : familles actives par semaine (26 dernières) ----------
-- Déduite de l'historique déjà collecté (family_state_history) : une famille
-- est « active » une semaine si son état a été archivé (donc modifié) cette
-- semaine-là. Aucune collecte supplémentaire nécessaire.
create or replace function public.admin_series_activite()
returns table(semaine date, n integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select date_trunc('week', h.saved_at)::date as semaine, count(distinct h.family_id)::int as n
    from family_state_history h
    where h.saved_at >= date_trunc('week', now()) - interval '25 weeks'
    group by 1 order by 1;
end; $$;

-- ---------- RPC admin : derniers arrivants (nouvelles familles) ----------
create or replace function public.admin_list_families_recent(p_limit integer default 10)
returns table(id uuid, name text, owner_email text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text,
      (select u.email::text from auth.users u where u.id = f.owner_id),
      f.created_at
    from families f
    order by f.created_at desc
    limit greatest(1, least(coalesce(p_limit, 10), 100));
end; $$;

-- =====================================================================
-- ACTIVITÉ D'USAGE (ouvertures de l'app) — mesure côté application
-- ---------------------------------------------------------------------
-- Une app statique ne voit pas les logs serveur : on mesure donc l'activité
-- côté client, très sobrement. Une ligne par (jour, famille, type). Aucune
-- donnée nominative d'enfant. Sert aux « familles actives » réelles.
-- =====================================================================
create table if not exists public.usage_events (
  day date not null default current_date,
  family_id uuid references public.families(id) on delete cascade,
  kind text not null default 'open',            -- 'open' (ouverture de l'app)
  count integer not null default 0,
  primary key (day, family_id, kind)
);
create index if not exists idx_usage_day on public.usage_events(day);
alter table public.usage_events enable row level security;
-- Lecture réservée aux admins ; l'écriture ne passe QUE par track_usage.
drop policy if exists "admins read usage" on public.usage_events;
create policy "admins read usage" on public.usage_events for select using (is_admin());

-- RPC : incrémente le compteur d'usage du jour pour une famille. Best-effort :
-- silencieuse si la famille est absente ou l'appelant non membre (ne bloque
-- jamais le client). Security definer => pas besoin de policy d'écriture.
create or replace function public.track_usage(p_family uuid, p_kind text default 'open')
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_family is null or not is_family_member(p_family) then return; end if;
  insert into usage_events(day, family_id, kind, count)
    values (current_date, p_family, coalesce(nullif(trim(p_kind), ''), 'open'), 1)
  on conflict (day, family_id, kind) do update set count = usage_events.count + 1;
end; $$;

-- RPC admin : agrégats d'usage (familles actives jour / 7 j / 30 j + ouvertures).
create or replace function public.admin_usage_stats()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'actifs_jour',    (select count(distinct family_id) from usage_events where day = current_date),
    'actifs_7j',      (select count(distinct family_id) from usage_events where day >= current_date - 6),
    'actifs_30j',     (select count(distinct family_id) from usage_events where day >= current_date - 29),
    'ouvertures_30j', (select coalesce(sum(count), 0) from usage_events where kind = 'open' and day >= current_date - 29)
  ) into resultat;
  return resultat;
end; $$;

-- RPC admin : familles actives par jour (30 derniers jours).
create or replace function public.admin_series_usage()
returns table(jour date, familles integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select u.day as jour, count(distinct u.family_id)::int as familles
    from usage_events u
    where u.day >= current_date - 29
    group by u.day order by u.day;
end; $$;

-- ---------- RPC admin : export intégral (sauvegarde JSON) ----------
-- Filet de sécurité indépendant de pg_dump : renvoie l'ensemble des données
-- applicatives en un seul objet JSON, téléchargeable côté client. Utile pour
-- vérification croisée après migration. Lecture seule, réservé aux admins.
-- L'historique est déjà borné à 40 instantanés/famille (déclencheur d'archivage).
create or replace function public.admin_export_all()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'export_version',        1,
    'genere_le',             now(),
    'families',              (select coalesce(json_agg(f), '[]'::json) from families f),
    'family_members',        (select coalesce(json_agg(json_build_object(
                                 'family_id', m.family_id, 'user_id', m.user_id, 'role', m.role,
                                 'email', (select u.email from auth.users u where u.id = m.user_id),
                                 'created_at', m.created_at)), '[]'::json) from family_members m),
    'family_state',          (select coalesce(json_agg(s), '[]'::json) from family_state s),
    'family_state_history',  (select coalesce(json_agg(h), '[]'::json) from family_state_history h),
    'app_config',            (select coalesce(json_agg(c), '[]'::json) from app_config c),
    'feedback',              (select coalesce(json_agg(fb), '[]'::json) from feedback fb),
    'referrals',             (select coalesce(json_agg(r), '[]'::json) from referrals r),
    'waitlist',              (select coalesce(json_agg(w), '[]'::json) from waitlist w),
    'usage_events',          (select coalesce(json_agg(ue), '[]'::json) from usage_events ue),
    'donations',             (select coalesce(json_agg(d), '[]'::json) from donations d)
  ) into resultat;
  return resultat;
end; $$;

-- =====================================================================
-- DONS (suivi des paiements Stripe) — écriture réservée à l'edge function
-- ---------------------------------------------------------------------
-- Alimentée UNIQUEMENT par la fonction stripe-webhook (clé service_role,
-- qui contourne RLS par conception). Aucune policy d'écriture n'est créée
-- ici : ni les familles ni même les admins ne peuvent insérer depuis le
-- client — seul le webhook, authentifié par la signature Stripe, le peut.
-- Les liens de don étant des Payment Links génériques (non génératifs par
-- famille), le rattachement à une famille se fait par e-mail, à titre
-- indicatif : `family_id` reste NULL si aucune correspondance n'est trouvée.
-- =====================================================================
create table if not exists public.donations (
  id bigint generated always as identity primary key,
  stripe_event_id text not null unique,     -- idempotence : un événement = une ligne
  stripe_event_type text not null,
  family_id uuid references public.families(id) on delete set null,
  email text,
  amount_cents integer not null default 0,
  currency text not null default 'eur',
  kind text not null default 'one_time',    -- 'one_time' | 'subscription'
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);
create index if not exists idx_donations_created on public.donations(created_at desc);
alter table public.donations enable row level security;
drop policy if exists "admins read donations" on public.donations;
create policy "admins read donations" on public.donations for select using (is_admin());

-- Rattachement (best-effort) d'un e-mail de donateur à une famille existante.
-- Réservée au rôle service_role (donc uniquement à l'edge function du
-- webhook Stripe, authentifiée par sa clé service_role) : ni les admins ni
-- les familles ne peuvent l'appeler depuis le client, pour ne jamais
-- exposer un lien e-mail → famille à un utilisateur ordinaire.
create or replace function public.internal_family_id_by_email(p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  -- coalesce() est indispensable : sans rôle défini, auth.role() renvoie NULL,
  -- et "NULL <> 'service_role'" vaut NULL (donc ni vrai ni faux) en SQL, ce
  -- qui laisserait passer l'appel au lieu de le refuser.
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Accès refusé'; end if;
  select m.family_id into fid
    from family_members m join auth.users u on u.id = m.user_id
    where lower(u.email) = lower(trim(coalesce(p_email, '')))
    order by m.created_at asc
    limit 1;
  return fid;
end; $$;

-- RPC admin : agrégats des dons (lecture seule).
create or replace function public.admin_donations_stats()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'total_cents',            (select coalesce(sum(amount_cents), 0) from donations),
    'total_30j_cents',        (select coalesce(sum(amount_cents), 0) from donations where created_at >= now() - interval '30 days'),
    'nb_dons',                (select count(*) from donations),
    'donateurs_uniques',      (select count(distinct email) from donations where email is not null),
    'recurrent_30j_cents',    (select coalesce(sum(amount_cents), 0) from donations
                                 where kind = 'subscription' and created_at >= now() - interval '30 days')
  ) into resultat;
  return resultat;
end; $$;

-- RPC admin : derniers dons (détail).
create or replace function public.admin_list_donations(p_limit integer default 20)
returns table(created_at timestamptz, email text, amount_cents integer, currency text, kind text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select d.created_at, d.email::text, d.amount_cents, d.currency::text, d.kind::text
    from donations d
    order by d.created_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 200));
end; $$;

-- ---------- RPC admin : stockage (taille de la base et par table) ----------
-- Taille totale de la base + taille et nombre de lignes (estimé) par table du
-- schéma public. Lecture seule. Les octets sont mis en forme côté client.
create or replace function public.admin_db_stats()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'db_taille_octets', pg_database_size(current_database()),
    'tables', (
      select coalesce(json_agg(json_build_object(
        'nom',            t.relname,
        'taille_octets',  pg_total_relation_size(t.relid),
        'lignes',         t.n_live_tup
      ) order by pg_total_relation_size(t.relid) desc), '[]'::json)
      from pg_stat_user_tables t
      where t.schemaname = 'public'
    )
  ) into resultat;
  return resultat;
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

-- Statut de traitement d'un retour (additif, non destructif) :
--   'nouveau' (non lu) | 'lu' | 'traite'.
alter table public.feedback add column if not exists status text not null default 'nouveau';

-- RPC admin : consulter les retours (avec statut). La signature de retour
-- change : on supprime d'abord l'ancienne version (create or replace ne peut
-- pas modifier les colonnes de sortie).
drop function if exists public.admin_list_feedback();
create or replace function public.admin_list_feedback()
returns table(id bigint, created_at timestamptz, type text, message text, email text, family_id uuid, status text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query select f.id, f.created_at, f.type::text, f.message, f.email::text, f.family_id, f.status::text
               from feedback f order by f.created_at desc;
end; $$;

-- RPC admin : changer le statut d'un retour (lu / traité / nouveau).
create or replace function public.admin_set_feedback_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  update feedback
    set status = case when p_status in ('nouveau', 'lu', 'traite') then p_status else 'nouveau' end
    where id = p_id;
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

-- =====================================================================
-- MESURE : origine des inscriptions & activation J+1
-- ---------------------------------------------------------------------
-- Chantier « Socle de mesure » : savoir ce qui amène des familles, et
-- quelle part d'entre elles démarre réellement. Additif et ré-exécutable.
-- =====================================================================
alter table public.waitlist add column if not exists source text;
alter table public.families add column if not exists source text;

-- Activation J+1 : part des familles dont l'état a été enregistré dans les
-- 48 h suivant la création (trace d'un usage réel). On exclut les familles
-- créées il y a moins de 2 jours : elles n'ont pas encore eu leur chance.
create or replace function public.admin_activation()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'fenetre_jours', 30,
    'eligibles', count(*),
    'activees',  count(*) filter (where a.activee),
    'taux', case when count(*) = 0 then null
                 else round(100.0 * count(*) filter (where a.activee) / count(*)) end
  ) into resultat
  from (
    select f.id,
      exists (
        select 1 from family_state_history h
        where h.family_id = f.id and h.saved_at <= f.created_at + interval '48 hours'
      ) or exists (
        select 1 from usage_events u
        where u.family_id = f.id and u.day <= (f.created_at + interval '48 hours')::date
      ) as activee
    from families f
    where f.created_at <= now() - interval '2 days'
      and f.created_at >= now() - interval '30 days'
  ) a;
  return resultat;
end; $$;

-- Origine des inscriptions, agrégée sur 90 jours.
create or replace function public.admin_sources()
returns table(source text, familles integer, attente integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select coalesce(s.src, 'inconnu')::text as source,
           sum(s.f)::int as familles,
           sum(s.w)::int as attente
    from (
      select coalesce(nullif(f.source, ''), 'inconnu') as src, 1 as f, 0 as w
        from families f where f.created_at >= now() - interval '90 days'
      union all
      select coalesce(nullif(w.source, ''), 'inconnu') as src, 0 as f, 1 as w
        from waitlist w where w.created_at >= now() - interval '90 days'
    ) s
    group by 1
    order by 2 desc, 3 desc;
end; $$;

-- =====================================================================
-- ENVOIS AUTOMATIQUES : journal d'idempotence + file d'attente
-- ---------------------------------------------------------------------
-- Un e-mail parti ne se rattrape pas : le journal garantit qu'un même
-- envoi ne part JAMAIS deux fois, quel que soit le rejeu du déclencheur.
--   type : 'bienvenue' | 'activation' | 'rapport'
--   cle  : identifiant de famille, ou 'AAAA-MM' pour le rapport mensuel
-- L'envoi lui-même passe par la session de l'utilisateur connecté (la
-- fonction send-mail exige une authentification) et n'a lieu que si
-- app_config.mails_auto vaut « on ».
-- =====================================================================
create table if not exists public.mails_auto (
  type      text not null,
  cle       text not null,
  envoye_le timestamptz not null default now(),
  primary key (type, cle)
);
alter table public.mails_auto enable row level security;
drop policy if exists "admins lisent les envois" on public.mails_auto;
create policy "admins lisent les envois" on public.mails_auto for select using (is_admin());

create or replace function public.mail_auto_marquer(p_type text, p_cle text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_type), '') = '' or coalesce(trim(p_cle), '') = '' then return; end if;
  insert into mails_auto(type, cle) values (trim(p_type), trim(p_cle))
    on conflict (type, cle) do nothing;
end; $$;

create or replace function public.mail_auto_deja(p_type text, p_cle text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from mails_auto where type = p_type and cle = p_cle);
$$;

-- Familles à relancer : créées il y a 3 à 14 jours, aucun état jamais
-- enregistré (donc aucune mission validée), aucune relance déjà envoyée.
create or replace function public.admin_mails_en_attente()
returns table(famille_id uuid, famille text, email text, jours integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text,
           (select u.email::text from auth.users u where u.id = f.owner_id),
           extract(day from now() - f.created_at)::int
    from families f
    where f.created_at <= now() - interval '3 days'
      and f.created_at >= now() - interval '14 days'
      and not exists (select 1 from family_state_history h where h.family_id = f.id)
      and not exists (select 1 from usage_events u where u.family_id = f.id)
      and not exists (select 1 from mails_auto m where m.type = 'activation' and m.cle = f.id::text)
    order by f.created_at;
end; $$;

-- ---------- Droits d'exécution ----------
grant execute on function public.create_family(text, text)            to authenticated;
grant execute on function public.set_app_config(text, text)     to authenticated;
grant execute on function public.create_invite(uuid, text)      to authenticated;
grant execute on function public.invite_info(uuid)              to authenticated;
grant execute on function public.accept_invite(uuid)            to authenticated;
grant execute on function public.referral_quota(uuid)           to authenticated;
grant execute on function public.create_referral(uuid)          to authenticated;
grant execute on function public.referral_info(uuid)            to anon, authenticated;
grant execute on function public.claim_referral(uuid, uuid)     to authenticated;
grant execute on function public.referral_accepted_count(uuid)  to authenticated;
grant execute on function public.join_waitlist(text, text)            to anon, authenticated;
grant execute on function public.admin_list_waitlist()          to authenticated;
grant execute on function public.admin_activation()             to authenticated;
grant execute on function public.admin_sources()                to authenticated;
grant execute on function public.mail_auto_marquer(text, text)  to authenticated;
grant execute on function public.mail_auto_deja(text, text)     to authenticated;
grant execute on function public.admin_mails_en_attente()       to authenticated;
grant execute on function public.admin_remove_waitlist(text)    to authenticated;
grant execute on function public.is_admin()                     to authenticated;
grant execute on function public.admin_list_families()          to authenticated;
grant execute on function public.admin_set_plan(uuid, text)     to authenticated;
grant execute on function public.admin_delete_family(uuid)      to authenticated;
grant execute on function public.admin_stats()                  to authenticated;
grant execute on function public.admin_series_inscriptions()    to authenticated;
grant execute on function public.admin_series_activite()        to authenticated;
grant execute on function public.admin_list_families_recent(integer) to authenticated;
grant execute on function public.track_usage(uuid, text)        to authenticated;
grant execute on function public.admin_usage_stats()            to authenticated;
grant execute on function public.admin_series_usage()           to authenticated;
grant execute on function public.admin_db_stats()               to authenticated;
grant execute on function public.admin_export_all()             to authenticated;
grant execute on function public.admin_donations_stats()        to authenticated;
grant execute on function public.admin_list_donations(integer)  to authenticated;
grant execute on function public.internal_family_id_by_email(text) to service_role;
revoke execute on function public.internal_family_id_by_email(text) from public, anon, authenticated;
grant execute on function public.submit_feedback(text, text, jsonb, uuid) to authenticated;
grant execute on function public.admin_list_feedback()          to authenticated;
grant execute on function public.admin_set_feedback_status(bigint, text) to authenticated;
grant execute on function public.delete_family(uuid)            to authenticated;

-- ---------- Temps réel sur l'état de jeu (tolérant si déjà activé) ----------
do $$ begin
  alter publication supabase_realtime add table public.family_state;
exception when others then null; end $$;

-- ---------- Recharge le cache de l'API (PostgREST) ----------
notify pgrst, 'reload schema';
