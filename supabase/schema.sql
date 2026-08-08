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

-- ---------- L'Arbre des familles : code de parrainage permanent ----------
-- Un lien à usage unique oblige à un aller-retour par ami invité : mesuré en
-- production, 30 liens créés n'avaient produit que 4 filleuls. Un code unique
-- et permanent par famille se colle une fois dans un groupe de parents, se
-- met sur un QR code et s'imprime. Le mécanisme à jeton unique ci-dessus est
-- conservé : il sert aux invitations nominatives.
alter table public.families add column if not exists referral_code text;
create unique index if not exists idx_families_refcode
  on public.families(referral_code) where referral_code is not null;
-- Trace du code effectivement utilisé (un parrainage peut venir d'un jeton).
alter table public.referrals add column if not exists via_code text;

-- Alphabet sans caractère ambigu : ni O/0, ni I/1/L, pour qu'un code lu sur
-- une carte imprimée puisse être recopié à la main sans erreur.
-- `search_path` fixé même sans security definer : la fonction n'appelle que des
-- primitives, mais un search_path mutable est signalé par l'analyseur Supabase
-- et rien ne justifie de le laisser ouvert.
create or replace function public.gen_referral_code()
returns text language plpgsql set search_path = public as $$
declare alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; r text := ''; i integer;
begin
  for i in 1..7 loop
    r := r || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return r;
end; $$;

-- Renvoie le code permanent de la famille, en le créant au premier appel.
create or replace function public.referral_code_famille(p_family uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text; essai integer := 0;
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  select referral_code into c from families where id = p_family;
  if c is not null then return c; end if;
  loop
    essai := essai + 1;
    c := gen_referral_code();
    begin
      update families set referral_code = c where id = p_family;
      return c;
    exception when unique_violation then
      if essai >= 10 then raise exception 'Génération du code impossible'; end if;
    end;
  end loop;
end; $$;

-- Régénère le code : le lien précédemment partagé cesse d'être reconnu.
-- (Le seul « risque » d'un code diffusé est d'amener des familles ; mais une
-- famille doit pouvoir reprendre la main sur ce qu'elle a publié.)
create or replace function public.regenerer_referral_code(p_family uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  update families set referral_code = null where id = p_family;
  return referral_code_famille(p_family);
end; $$;

-- Nom du parrain, à partir du code, pour la bannière d'accueil (sans compte).
-- Un code permanent n'est jamais « consommé » : il reste valable.
create or replace function public.referral_info_par_code(p_code text)
returns table(parrain_name text, valid boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select f.name::text, true
    from families f
    where f.referral_code = upper(trim(p_code));
end; $$;

-- Rattache la famille nouvellement créée au parrain désigné par le code.
-- Silencieuse en cas de code inconnu, d'auto-parrainage, ou si la famille est
-- déjà rattachée : une inscription ne doit jamais échouer pour cette raison.
create or replace function public.claim_referral_code(p_code text, p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
declare parrain uuid; code text := upper(trim(coalesce(p_code, '')));
begin
  if code = '' or p_family is null then return; end if;
  if not is_family_member(p_family) then return; end if;   -- on ne rattache que SA famille
  select id into parrain from families where referral_code = code;
  if parrain is null or parrain = p_family then return; end if;
  if exists (select 1 from referrals where accepted_family = p_family) then return; end if;
  insert into referrals(family_id, created_by, accepted_at, accepted_family, via_code)
    values (parrain, auth.uid(), now(), p_family, code);
end; $$;

-- ---------- L'Arbre des familles : bilan d'une famille et jauge collective ----
-- Règle cardinale : **un filleul compte quand sa famille est vivante**, c'est-
-- à-dire quand elle a ouvert l'application trois jours différents. Deux effets,
-- indissociables : créer des comptes jetables ne rapporte rien, et le décompte
-- récompense les familles bien choisies plutôt que le volume de liens envoyés.
-- Aucune donnée d'enfant n'est lue : seuls usage_events (jours d'ouverture) et
-- referrals interviennent. Aucune identité de filleul n'est renvoyée au parrain.
create or replace function public.parrainage_bilan(p_family uuid)
returns json language plpgsql security definer set search_path = public as $$
declare invitees integer; installees integer; palier integer; suivant integer; resultat json;
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  select count(*) into invitees
    from referrals r where r.family_id = p_family and r.accepted_at is not null;
  select count(*) into installees
    from referrals r
    where r.family_id = p_family and r.accepted_family is not null
      and arbre_jours_actifs(r.accepted_family) >= 3;
  -- Paliers d'effort : atteignables par toute famille, jamais perdus, et
  -- indépendants de ce que font les autres.
  palier := case when installees >= 10 then 4 when installees >= 5 then 3
                 when installees >= 3 then 2 when installees >= 1 then 1 else 0 end;
  suivant := case palier when 0 then 1 when 1 then 3 when 2 then 5 when 3 then 10 else null end;
  select json_build_object(
    'invitees', invitees,               -- familles arrivées grâce à cette famille
    'installees', installees,           -- celles qui vivent vraiment (3 jours)
    'palier', palier,                   -- 0 à 4
    'palier_suivant', suivant,          -- seuil du palier suivant (null si dernier)
    'manque', case when suivant is null then 0 else greatest(suivant - installees, 0) end
  ) into resultat;
  return resultat;
end; $$;

-- Jauge collective : des agrégats, jamais une identité. Le denominateur est un
-- jalon d'encouragement (25, 50, 100…), délibérément PAS le plafond de
-- familles : afficher un plafond comme objectif serait promettre une fête au
-- moment précis où les inscriptions basculent en liste d'attente.
create or replace function public.parrainage_jauge()
returns json language plpgsql security definer set search_path = public as $$
declare familles integer; filleuls integer; jalon integer; precedent integer; resultat json;
begin
  if auth.uid() is null then raise exception 'Accès refusé'; end if;
  select count(*) into familles from families;
  select count(*) into filleuls
    from referrals r where r.accepted_family is not null and arbre_jours_actifs(r.accepted_family) >= 3;
  select min(v) into jalon from (values (25),(50),(100),(250),(500)) as j(v) where v > familles;
  select max(v) into precedent from (values (0),(25),(50),(100),(250),(500)) as j(v) where v <= familles;
  select json_build_object(
    'familles', familles, 'filleuls', filleuls,
    'jalon', jalon, 'jalon_precedent', coalesce(precedent, 0)
  ) into resultat;
  return resultat;
end; $$;

-- ---------- Le tableau d'honneur : consentement explicite et pseudonyme ------
-- `families.name` contient très souvent un patronyme. L'afficher dans un
-- classement, c'est PUBLIER une donnée personnelle : il faut une base légale,
-- et seul le consentement tient ici (RGPD art. 6.1.a et 7). D'où :
--   * opt-in décoché par défaut, révocable en un clic ;
--   * un pseudonyme d'équipe choisi par la famille, JAMAIS families.name ;
--   * aucun prénom d'enfant, jamais ;
--   * visible des familles connectées seulement, pas du web public.
alter table public.families add column if not exists classement_optin boolean not null default false;
alter table public.families add column if not exists classement_pseudo text;

-- Consentement et pseudonyme. Refuse d'inscrire une famille sans pseudonyme :
-- accepter sans pseudonyme reviendrait à publier son vrai nom.
create or replace function public.definir_classement_optin(p_family uuid, p_optin boolean, p_pseudo text)
returns void language plpgsql security definer set search_path = public as $$
declare pseudo text := nullif(btrim(coalesce(p_pseudo, '')), '');
begin
  if not is_family_member(p_family) and not is_admin() then raise exception 'Accès refusé'; end if;
  if p_optin then
    if pseudo is null then raise exception 'Un nom d''équipe est nécessaire pour figurer au tableau'; end if;
    if length(pseudo) > 24 then pseudo := left(pseudo, 24); end if;
    update families set classement_optin = true, classement_pseudo = pseudo where id = p_family;
  else
    -- Retrait : on efface aussi le pseudonyme, on ne conserve rien d'inutile.
    update families set classement_optin = false, classement_pseudo = null where id = p_family;
  end if;
end; $$;

-- Tableau d'honneur. p_saison = 'AAAA-MM' pour le mois, null pour tous les temps.
-- Sans saison, la première famille arrivée gagnerait à vie et démotiverait
-- toutes les suivantes : la saison mensuelle est structurelle, pas cosmétique.
-- Renvoie le seuil d'apparition, le nombre de familles consentantes, le top 10
-- (pseudonymes seulement) et la ligne de la famille appelante. Le rang n'est
-- calculé que pour une famille CONSENTANTE : on n'apprend jamais à une famille
-- qu'elle est 47ᵉ sur 52.
create or replace function public.classement_parrainages(p_saison text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  ma_famille uuid; seuil integer; consentantes integer;
  top json; mien integer; mon_rang integer; resultat json;
begin
  if auth.uid() is null then raise exception 'Accès refusé'; end if;
  select coalesce(nullif(value, '')::integer, 10) into seuil from app_config where key = 'classement_seuil';
  seuil := coalesce(seuil, 10);
  select count(*) into consentantes from families where classement_optin;

  create temp table if not exists _cls (family_id uuid, n integer) on commit drop;
  delete from _cls;
  insert into _cls
    select r.family_id, count(*)::integer
    from referrals r
    where r.accepted_family is not null
      and r.accepted_at is not null
      and arbre_jours_actifs(r.accepted_family) >= 3
      and (p_saison is null or to_char(r.accepted_at, 'YYYY-MM') = p_saison)
    group by r.family_id;

  select coalesce(json_agg(x order by x.n desc, x.pseudo), '[]'::json) into top from (
    select f.classement_pseudo::text as pseudo, c.n
    from _cls c join families f on f.id = c.family_id
    where f.classement_optin and f.classement_pseudo is not null and c.n > 0
    order by c.n desc, f.classement_pseudo
    limit 10
  ) x;

  -- La famille appelante : son propre compte, et son rang seulement si elle a
  -- consenti à figurer.
  select fm.family_id into ma_famille from family_members fm where fm.user_id = auth.uid() limit 1;
  select coalesce((select n from _cls where family_id = ma_famille), 0) into mien;
  if ma_famille is not null and mien > 0
     and exists (select 1 from families where id = ma_famille and classement_optin) then
    select count(*) + 1 into mon_rang from _cls c
      join families f on f.id = c.family_id
      where f.classement_optin and c.n > mien;
  else
    mon_rang := null;
  end if;

  select json_build_object(
    'saison', p_saison, 'seuil', seuil, 'consentantes', consentantes,
    'visible', (consentantes >= seuil),
    'top', top, 'mien', mien, 'mon_rang', mon_rang,
    'moi_inscrite', coalesce((select classement_optin from families where id = ma_famille), false),
    'mon_pseudo', (select classement_pseudo from families where id = ma_famille)
  ) into resultat;
  return resultat;
end; $$;

-- ---------- Les Arènes : défi privé entre familles amies ----------------------
-- Dispositif VOLONTAIREMENT séparé du reste de l'application, et accessible par
-- une page qui n'est liée nulle part (defi.html, noindex). L'application
-- publique garde sa doctrine — pas de classement, pas de perdants ; ici, des
-- adultes qui se connaissent CHOISISSENT de se défier, dans une arène privée,
-- pour une durée limitée.
-- Trois règles tenues en base :
--   * on n'entre dans une arène qu'avec son code ET en choisissant un nom
--     d'équipe : ce choix vaut consentement à figurer au classement de CETTE
--     arène (RGPD art. 6.1.a) ; families.name n'y apparaît jamais ;
--   * seuls les parrainages obtenus PENDANT l'arène comptent : personne
--     n'arrive avec un stock d'avance ;
--   * aucun enfant n'entre dans le calcul, à aucun titre.
create table if not exists public.arenes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  family_id uuid not null references public.families(id) on delete cascade,   -- créatrice
  created_at timestamptz not null default now(),
  fin_le timestamptz not null
);
create index if not exists idx_arenes_code on public.arenes(code);

create table if not exists public.arene_membres (
  arene_id uuid not null references public.arenes(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  pseudo text not null,
  rejoint_le timestamptz not null default now(),
  primary key (arene_id, family_id)
);
alter table public.arenes enable row level security;
alter table public.arene_membres enable row level security;
-- Aucune politique de lecture directe : tout passe par les RPC ci-dessous, qui
-- ne renvoient que des pseudonymes et des points.

-- Création d'une arène. Durée bornée entre 7 et 90 jours : en dessous, personne
-- n'a le temps de jouer ; au-delà, le défi s'éteint de lui-même.
create or replace function public.arene_creer(p_family uuid, p_nom text, p_jours integer, p_pseudo text)
returns json language plpgsql security definer set search_path = public as $$
declare c text; essai integer := 0; nom text; pseudo text; jours integer; a_id uuid;
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  nom := left(nullif(btrim(coalesce(p_nom, '')), ''), 40);
  pseudo := left(nullif(btrim(coalesce(p_pseudo, '')), ''), 24);
  if nom is null then raise exception 'Donne un nom à ton arène'; end if;
  if pseudo is null then raise exception 'Choisis le nom de ton équipe'; end if;
  jours := least(greatest(coalesce(p_jours, 30), 7), 90);
  loop
    essai := essai + 1;
    c := gen_referral_code();
    begin
      insert into arenes(code, nom, family_id, fin_le)
        values (c, nom, p_family, now() + (jours || ' days')::interval)
        returning id into a_id;
      exit;
    exception when unique_violation then
      if essai >= 10 then raise exception 'Génération du code impossible'; end if;
    end;
  end loop;
  insert into arene_membres(arene_id, family_id, pseudo) values (a_id, p_family, pseudo)
    on conflict (arene_id, family_id) do update set pseudo = excluded.pseudo;
  return json_build_object('code', c, 'nom', nom, 'jours', jours);
end; $$;

-- Aperçu d'une arène AVANT d'avoir un compte : c'est ce que voit l'ami qui
-- reçoit le lien. Rien d'autre que le nom de l'arène, le nombre d'équipes et le
-- temps restant — aucun nom de famille, aucune adresse.
create or replace function public.arene_apercu(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare a arenes; resultat json;
begin
  select * into a from arenes where code = upper(btrim(coalesce(p_code, '')));
  if not found then return null; end if;
  select json_build_object(
    'nom', a.nom,
    'equipes', (select count(*) from arene_membres m where m.arene_id = a.id),
    'jours_restants', greatest(0, extract(day from a.fin_le - now())::int),
    'terminee', (a.fin_le <= now()),
    'hote', (select m.pseudo from arene_membres m where m.arene_id = a.id and m.family_id = a.family_id)
  ) into resultat;
  return resultat;
end; $$;

-- Rejoindre une arène : le code + un nom d'équipe. Choisir ce nom vaut
-- consentement à figurer au classement de cette arène, et de nulle part ailleurs.
create or replace function public.arene_rejoindre(p_code text, p_family uuid, p_pseudo text)
returns json language plpgsql security definer set search_path = public as $$
declare a arenes; pseudo text;
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  select * into a from arenes where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'Cette arène n''existe pas'; end if;
  if a.fin_le <= now() then raise exception 'Cette arène est terminée'; end if;
  pseudo := left(nullif(btrim(coalesce(p_pseudo, '')), ''), 24);
  if pseudo is null then raise exception 'Choisis le nom de ton équipe'; end if;
  insert into arene_membres(arene_id, family_id, pseudo) values (a.id, p_family, pseudo)
    on conflict (arene_id, family_id) do update set pseudo = excluded.pseudo;
  return json_build_object('code', a.code, 'nom', a.nom);
end; $$;

-- Quitter une arène : on efface le nom d'équipe avec l'inscription. Le retrait
-- doit être aussi simple que l'entrée (RGPD art. 7.3).
create or replace function public.arene_quitter(p_code text, p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  delete from arene_membres m using arenes a
    where m.arene_id = a.id and a.code = upper(btrim(coalesce(p_code, ''))) and m.family_id = p_family;
end; $$;

-- Classement d'une arène, réservé à ses membres.
-- Barème : 100 points par famille VIVANTE amenée pendant l'arène (trois jours
-- d'usage de sa part), 25 points par famille arrivée mais pas encore vivante.
-- Les 25 deviennent 100 quand elle prend le pli : le score monte tout seul si
-- l'on a bien choisi qui inviter, et un compte jetable ne rapporte que 25.
create or replace function public.arene_classement(p_code text, p_family uuid)
returns json language plpgsql security definer set search_path = public as $$
declare a arenes; resultat json;
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  select * into a from arenes where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'Cette arène n''existe pas'; end if;
  if not exists (select 1 from arene_membres m where m.arene_id = a.id and m.family_id = p_family)
    then raise exception 'Tu n''es pas dans cette arène'; end if;

  select json_build_object(
    'code', a.code, 'nom', a.nom,
    'debut', a.created_at, 'fin', a.fin_le,
    'jours_restants', greatest(0, extract(day from a.fin_le - now())::int),
    'terminee', (a.fin_le <= now()),
    'equipes', coalesce((
      select json_agg(x order by x.points desc, x.vivantes desc, x.pseudo)
      from (
        -- On ne renvoie PAS family_id : le drapeau « moi » suffit à se
        -- reconnaître, et l'identifiant interne des autres familles n'a rien
        -- à faire dans la réponse.
        -- Les compteurs supplémentaires (jours de chasse, meilleur jour,
        -- première prise, liste des jours) servent aux hauts faits, à la série
        -- en cours et au petit graphe de l'arène. Ce sont des agrégats de dates
        -- d'arrivée : aucune identité de filleul n'en sort.
        select m.pseudo::text as pseudo,
               v.vivantes, v.en_route,
               (v.vivantes * 100 + v.en_route * 25) as points,
               v.jours, v.meilleur_jour, v.premiere_le, v.jours_liste,
               (m.family_id = p_family) as moi
        from arene_membres m
        cross join lateral (
          select
            count(*) filter (where arbre_jours_actifs(r.accepted_family) >= 3) as vivantes,
            count(*) filter (where arbre_jours_actifs(r.accepted_family) < 3)  as en_route,
            count(distinct r.accepted_at::date) as jours,
            coalesce(max(j.n), 0) as meilleur_jour,
            min(r.accepted_at) as premiere_le,
            coalesce(array_agg(distinct r.accepted_at::date::text
                     order by r.accepted_at::date::text), '{}') as jours_liste
          from referrals r
          left join lateral (
            select count(*) as n from referrals r2
            where r2.family_id = r.family_id and r2.accepted_family is not null
              and r2.accepted_at::date = r.accepted_at::date
              and r2.accepted_at between a.created_at and a.fin_le
          ) j on true
          where r.family_id = m.family_id
            and r.accepted_family is not null
            and r.accepted_at between a.created_at and a.fin_le
        ) v
        where m.arene_id = a.id
      ) x), '[]'::json)
  ) into resultat;
  return resultat;
end; $$;

-- Les arènes de la famille : pour retrouver un défi en cours.
create or replace function public.arene_mes_arenes(p_family uuid)
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_family_member(p_family) then raise exception 'Accès refusé'; end if;
  select coalesce(json_agg(x order by x.fin_le desc), '[]'::json) into resultat from (
    select a.code, a.nom, a.fin_le, (a.fin_le <= now()) as terminee,
           (select count(*) from arene_membres m2 where m2.arene_id = a.id) as equipes
    from arene_membres m join arenes a on a.id = m.arene_id
    where m.family_id = p_family
  ) x;
  return resultat;
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

-- ---------- Vagues d'invitation ----------
-- Chaque candidat reçoit un jeton personnel. Le jeton n'autorise la création
-- d'une famille qu'une fois la vague envoyée (invited_at renseigné).
alter table public.waitlist add column if not exists token uuid default gen_random_uuid();
alter table public.waitlist add column if not exists invited_at timestamptz;
update public.waitlist set token = gen_random_uuid() where token is null;
create index if not exists waitlist_token_idx on public.waitlist(token);

-- Vérification publique d'un jeton de vague : ne renvoie qu'un booléen,
-- jamais l'e-mail. Vrai seulement si la vague a bien été envoyée.
create or replace function public.waitlist_invitation_valide(p_token uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from waitlist w where w.token = p_token and w.invited_at is not null);
$$;

-- Prochaine vague : les plus anciens candidats jamais invités.
create or replace function public.admin_vague_suivante(p_taille integer default 20)
returns table(email text, token uuid, created_at timestamptz, source text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select w.email::text, w.token, w.created_at, w.source::text
    from waitlist w
    where w.invited_at is null
    order by w.created_at
    limit greatest(1, least(coalesce(p_taille, 20), 200));
end; $$;

-- Marque un candidat comme invité (appelé après l'envoi réussi de l'e-mail).
create or replace function public.admin_vague_marquer(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  update waitlist set invited_at = now()
   where email = lower(trim(p_email)) and invited_at is null;
end; $$;

-- Relance unique à J+7 : invité il y a au moins sept jours, toujours sans
-- compte, et jamais relancé. Une seule relance, la table mails_auto le garantit.
create or replace function public.admin_vagues_a_relancer()
returns table(email text, token uuid, jours integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select w.email::text, w.token, extract(day from now() - w.invited_at)::int
    from waitlist w
    where w.invited_at is not null
      and w.invited_at <= now() - interval '7 days'
      and not exists (select 1 from auth.users u where lower(u.email) = w.email)
      and not exists (select 1 from mails_auto m where m.type = 'vague_relance' and m.cle = w.email)
    order by w.invited_at;
end; $$;

-- Conversion des vagues : invités, inscrits, taux. Sert au critère d'ouverture
-- publique (chantier « Liste d'attente »).
create or replace function public.admin_vagues_stats()
returns json language plpgsql security definer set search_path = public as $$
declare invites_n integer; convertis_n integer; attente_n integer;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select count(*) into invites_n from waitlist where invited_at is not null;
  select count(*) into convertis_n from waitlist w
    where w.invited_at is not null
      and exists (select 1 from auth.users u where lower(u.email) = w.email);
  select count(*) into attente_n from waitlist where invited_at is null;
  return json_build_object(
    'invites', invites_n,
    'convertis', convertis_n,
    'en_attente', attente_n,
    'taux', case when invites_n > 0 then round(convertis_n * 100.0 / invites_n)::int else null end
  );
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
-- plans, parrainages (acceptés au total, acceptés et créés sur 30 j — de quoi
-- calculer le coefficient viral k), liste d'attente, retours utilisateurs.
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
    'referrals_30j',        (select count(*) from referrals where accepted_at >= now() - interval '30 days'),
    'referrals_crees_30j',  (select count(*) from referrals where created_at >= now() - interval '30 days'),
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

-- Jours d'ouverture distincts d'une famille. Défini ICI, et non avec le reste
-- de « L'Arbre des familles », parce que cette fonction est en langage SQL :
-- son corps est validé à la création, et elle doit donc suivre la table
-- usage_events dont elle dépend. Placée plus haut, elle faisait échouer tout le
-- script sur une base neuve — invisible en production, où la table préexistait.
create or replace function public.arbre_jours_actifs(p_family uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(count(distinct day), 0)::integer from usage_events where family_id = p_family;
$$;

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

-- Portabilité (art. 20) : le parent récupère les retours qu'il a écrits, sans
-- avoir à les demander. Ne renvoie QUE ses propres messages.
create or replace function public.mes_retours()
returns table(created_at timestamptz, type text, message text, status text)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  return query
    select f.created_at, f.type::text, f.message, f.status::text
    from feedback f
    where f.user_id = auth.uid()
    order by f.created_at;
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
-- Droit à l'effacement : supprimer la famille doit aussi effacer les données
-- personnelles restées ailleurs. Les retours sont ANONYMISÉS plutôt que
-- supprimés : le message reste exploitable pour améliorer l'app (aucun retour
-- ne se perd), mais plus rien ne le rattache à une personne.
create or replace function public.delete_family(p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from families where id = p_family;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Accès refusé : seul le propriétaire peut supprimer la famille';
  end if;

  -- 1) Retours : on coupe le lien avec la personne, on garde le message.
  update feedback
     set email = null, user_id = null, family_id = null,
         context = null                      -- contexte technique : navigateur, etc.
   where family_id = p_family or user_id = v_owner;

  -- 2) Liste d'attente : l'adresse n'a plus de raison d'y figurer.
  delete from waitlist
   where email = (select lower(u.email) from auth.users u where u.id = v_owner);

  -- 3) Journal des envois automatiques : les clés portent l'e-mail ou l'id famille.
  delete from mails_auto
   where cle = p_family::text
      or cle = (select lower(u.email) from auth.users u where u.id = v_owner);

  -- 4) La famille et tout ce qui en dépend (membres, état, historique,
  --    invitations, parrainages, événements d'usage) : suppression en cascade.
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

-- Familles à qui proposer le parrainage : installées depuis au moins trois
-- semaines, encore actives (état modifié dans les 14 jours), qui n'ont créé
-- aucun lien de parrainage, et à qui la proposition n'a jamais été envoyée.
-- Ne lit aucune donnée d'enfant.
create or replace function public.admin_parrainages_a_proposer()
returns table(famille_id uuid, famille text, email text, jours integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text,
           (select u.email::text from auth.users u where u.id = f.owner_id),
           extract(day from now() - f.created_at)::int
    from families f
    where f.created_at <= now() - interval '21 days'
      and exists (select 1 from family_state s where s.family_id = f.id
                    and s.updated_at >= now() - interval '14 days')
      and not exists (select 1 from referrals r where r.family_id = f.id)
      and not exists (select 1 from mails_auto m where m.type = 'parrainage' and m.cle = f.id::text)
    order by f.created_at;
end; $$;

-- Familles CONVAINCUES à qui proposer de semer : au moins cinq jours
-- d'ouverture distincts, une première ouverture remontant à sept jours au
-- moins, aucune famille amenée à ce jour, et jamais relancées sur ce motif.
-- La proposition voisine (admin_parrainages_a_proposer) attend trois semaines :
-- deux semaines de trop pour une famille qui a déjà pris le pli.
-- Ne lit aucune donnée d'enfant : usage_events et referrals seulement.
create or replace function public.admin_parrainages_actifs_a_relancer()
returns table(famille_id uuid, famille text, email text, jours_actifs integer)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text,
           (select u.email::text from auth.users u where u.id = f.owner_id),
           (select count(distinct e.day)::int from usage_events e where e.family_id = f.id)
    from families f
    where (select count(distinct e.day) from usage_events e where e.family_id = f.id) >= 5
      and (select min(e.day) from usage_events e where e.family_id = f.id) <= current_date - 7
      and not exists (select 1 from referrals r where r.family_id = f.id and r.accepted_at is not null)
      and not exists (select 1 from mails_auto m where m.type = 'parrainage_actif' and m.cle = f.id::text)
    order by f.created_at;
end; $$;

-- ---------- Entonnoir d'activation (chantier « Activation & rétention ») ------
-- admin_activation() mesure J+1, et c'est insuffisant : mesuré sur la base
-- réelle, 10 familles sur 10 avaient créé un enfant et modifié leur état au
-- moins une fois, mais 2 seulement l'avaient fait trois fois. La friction n'est
-- donc PAS l'accueil : c'est le retour du deuxième et du troisième jour, et
-- aucun indicateur ne le montrait.
-- Cette fonction expose l'entonnoir complet, en comptages seulement — le nombre
-- d'enfants est compté, jamais lu.
create or replace function public.admin_entonnoir()
returns json language plpgsql security definer set search_path = public as $$
declare resultat json;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'familles',        count(*),
    'avec_enfant',     count(*) filter (where e.nb_enfants > 0),
    'un_usage',        count(*) filter (where e.touches >= 1),
    'trois_usages',    count(*) filter (where e.touches >= 3),
    'dix_usages',      count(*) filter (where e.touches >= 10),
    'actives_7j',      count(*) filter (where e.dernier >= current_date - 6),
    'actives_30j',     count(*) filter (where e.dernier >= current_date - 29),
    'endormies_30j',   count(*) filter (where e.dernier < current_date - 29),
    -- Le décrochage le plus coûteux : elles ont essayé, puis renoncé.
    'essaye_puis_parti', count(*) filter (where e.touches >= 1 and e.touches < 3)
  ) into resultat
  from (
    select f.id,
      (select count(*) from jsonb_object_keys(coalesce(s.data -> 'enfants', '{}'::jsonb))) as nb_enfants,
      greatest(
        (select count(*) from family_state_history h where h.family_id = f.id),
        (select count(distinct u.day) from usage_events u where u.family_id = f.id)
      ) as touches,
      coalesce(s.updated_at::date, f.created_at::date) as dernier
    from families f left join family_state s on s.family_id = f.id
  ) e;
  return resultat;
end; $$;

-- Familles endormies à réveiller : sans activité depuis 30 jours, mais pas
-- au-delà de six mois — passé ce délai, insister devient du harcèlement, et le
-- silence est une réponse. Un envoi par trimestre au maximum : la clé
-- d'idempotence porte le trimestre, et elle est calculée ici pour que les deux
-- côtés (base et client) ne puissent pas diverger dans leur définition.
create or replace function public.admin_familles_endormies()
returns table(famille_id uuid, famille text, email text, jours_sommeil integer, cle_trimestre text)
language plpgsql security definer set search_path = public as $$
declare trimestre text := to_char(now(), 'YYYY') || 'T' || to_char(now(), 'Q');
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select f.id, f.name::text,
           (select u.email::text from auth.users u where u.id = f.owner_id),
           (current_date - coalesce(s.updated_at::date, f.created_at::date))::int,
           (f.id::text || ':' || trimestre)
    from families f left join family_state s on s.family_id = f.id
    where coalesce(s.updated_at::date, f.created_at::date) between
            current_date - 180 and current_date - 30
      and not exists (
        select 1 from mails_auto m
        where m.type = 'reactivation' and m.cle = f.id::text || ':' || trimestre)
    order by coalesce(s.updated_at, f.created_at) desc;
end; $$;

-- ---------- Journal des changements automatiques ----------
-- Tout ce qui s'applique tout seul (plafond franchi, vague partie, décision
-- nouvellement ouverte) est consigné ici, et l'administrateur en est averti
-- par e-mail — une seule fois par changement, quel que soit l'appareil.
create table if not exists public.changements (
  id bigint generated always as identity primary key,
  type text not null,                 -- 'plafond' | 'vague' | 'relances' | 'decision'
  cle text not null,                  -- clé d'unicité (mois, id de décision…)
  resume text,                        -- une phrase, telle qu'envoyée
  notifie_le timestamptz,             -- e-mail parti
  created_at timestamptz default now(),
  unique (type, cle)
);
alter table public.changements enable row level security;
-- Pas de politique publique : tout passe par les RPC ci-dessous.

-- Enregistre un changement. Renvoie true seulement la PREMIÈRE fois : c'est ce
-- booléen qui autorise l'envoi de l'e-mail, donc jamais deux fois le même.
create or replace function public.changement_noter(p_type text, p_cle text, p_resume text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_nouveau boolean := false;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  insert into changements(type, cle, resume) values (p_type, p_cle, left(coalesce(p_resume, ''), 500))
    on conflict (type, cle) do nothing;
  get diagnostics v_nouveau = row_count;
  return v_nouveau;
end; $$;

-- Marque l'e-mail comme parti.
create or replace function public.changement_notifie(p_type text, p_cle text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  update changements set notifie_le = now()
   where type = p_type and cle = p_cle and notifie_le is null;
end; $$;

-- Les derniers changements, pour la page Croissance.
create or replace function public.admin_changements(p_limit integer default 20)
returns table(type text, cle text, resume text, notifie_le timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select c.type::text, c.cle::text, c.resume::text, c.notifie_le, c.created_at
    from changements c order by c.created_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 100));
end; $$;

-- ---------- Plafond de familles (chantier « Modèle non marchand ») ----------
-- Le plafond protège deux ressources : le temps de support (une heure par
-- semaine) et la capacité gratuite de la base. Quand il est atteint, les
-- inscriptions passent d'elles-mêmes en mode « vagues » : une liste d'attente
-- est plus honnête qu'un service dégradé. Aucune intervention requise.
create or replace function public.capacite_projet()
returns json language plpgsql security definer set search_path = public as $$
declare v_plafond integer; v_familles integer; v_octets bigint;
begin
  select coalesce(nullif(trim(value), '')::integer, 800) into v_plafond
    from app_config where key = 'plafond_familles';
  if v_plafond is null then v_plafond := 800; end if;

  select count(*) into v_familles from families;
  select pg_database_size(current_database()) into v_octets;

  return json_build_object(
    'familles',        v_familles,
    'plafond',         v_plafond,
    'atteint',         v_familles >= v_plafond,
    'part_plafond',    case when v_plafond > 0
                            then round(v_familles * 100.0 / v_plafond)::int else null end,
    -- Palier gratuit Supabase : 500 Mo. Au-delà, l'offre payante devient nécessaire.
    'base_octets',     v_octets,
    'base_limite',     500 * 1024 * 1024,
    'part_base',       round(v_octets * 100.0 / (500 * 1024 * 1024))::int
  );
end; $$;

-- Bascule automatique : appelée à l'ouverture de l'app par l'administrateur.
-- Ne referme jamais rien de force et ne rouvre jamais seule : elle ne fait que
-- fermer les inscriptions une fois le plafond franchi.
create or replace function public.appliquer_plafond()
returns boolean language plpgsql security definer set search_path = public as $$
declare v_cap json; v_mode text;
begin
  if not is_admin() then raise exception 'Accès refusé'; end if;
  v_cap := capacite_projet();
  if not (v_cap ->> 'atteint')::boolean then return false; end if;
  select value into v_mode from app_config where key = 'inscriptions';
  if coalesce(v_mode, '') = 'vagues' then return false; end if;   -- déjà fermé
  insert into app_config(key, value, updated_at) values ('inscriptions', 'vagues', now())
    on conflict (key) do update set value = 'vagues', updated_at = now();
  return true;
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
grant execute on function public.referral_code_famille(uuid)    to authenticated;
grant execute on function public.regenerer_referral_code(uuid)  to authenticated;
grant execute on function public.referral_info_par_code(text)   to anon, authenticated;
grant execute on function public.claim_referral_code(text, uuid) to authenticated;
grant execute on function public.arbre_jours_actifs(uuid)       to authenticated;
grant execute on function public.parrainage_bilan(uuid)         to authenticated;
grant execute on function public.parrainage_jauge()             to authenticated;
-- Les Arènes (page defi.html). L'aperçu est ouvert à anon : c'est ce que voit
-- l'ami qui reçoit le lien avant d'avoir un compte. Il ne renvoie ni nom de
-- famille, ni adresse — seulement le nom de l'arène et le temps restant.
grant execute on function public.arene_creer(uuid, text, integer, text) to authenticated;
grant execute on function public.arene_apercu(text)             to anon, authenticated;
grant execute on function public.arene_rejoindre(text, uuid, text) to authenticated;
grant execute on function public.arene_quitter(text, uuid)      to authenticated;
grant execute on function public.arene_classement(text, uuid)   to authenticated;
grant execute on function public.arene_mes_arenes(uuid)         to authenticated;
grant execute on function public.definir_classement_optin(uuid, boolean, text) to authenticated;
grant execute on function public.classement_parrainages(text)   to authenticated;
grant execute on function public.join_waitlist(text, text)            to anon, authenticated;
grant execute on function public.admin_list_waitlist()          to authenticated;
grant execute on function public.admin_activation()             to authenticated;
grant execute on function public.admin_entonnoir()              to authenticated;
grant execute on function public.admin_familles_endormies()     to authenticated;
grant execute on function public.admin_sources()                to authenticated;
grant execute on function public.mail_auto_marquer(text, text)  to authenticated;
grant execute on function public.mail_auto_deja(text, text)     to authenticated;
grant execute on function public.admin_mails_en_attente()       to authenticated;
grant execute on function public.admin_parrainages_a_proposer() to authenticated;
grant execute on function public.admin_parrainages_actifs_a_relancer() to authenticated;
grant execute on function public.waitlist_invitation_valide(uuid) to anon, authenticated;
grant execute on function public.admin_vague_suivante(integer)  to authenticated;
grant execute on function public.admin_vague_marquer(text)      to authenticated;
grant execute on function public.admin_vagues_a_relancer()      to authenticated;
grant execute on function public.admin_vagues_stats()           to authenticated;
grant execute on function public.capacite_projet()              to authenticated;
grant execute on function public.appliquer_plafond()            to authenticated;
grant execute on function public.changement_noter(text, text, text) to authenticated;
grant execute on function public.changement_notifie(text, text) to authenticated;
grant execute on function public.admin_changements(integer)     to authenticated;
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
grant execute on function public.mes_retours()                  to authenticated;
grant execute on function public.admin_set_feedback_status(bigint, text) to authenticated;
grant execute on function public.delete_family(uuid)            to authenticated;

-- ---------- Temps réel sur l'état de jeu (tolérant si déjà activé) ----------
do $$ begin
  alter publication supabase_realtime add table public.family_state;
exception when others then null; end $$;

-- ---------- Recharge le cache de l'API (PostgREST) ----------
notify pgrst, 'reload schema';
