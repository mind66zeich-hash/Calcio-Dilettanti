-- =====================================================================
--  CALCIO DILETTANTI - schema database (Supabase / PostgreSQL)
--  Da incollare nel "SQL Editor" di Supabase ed eseguire UNA volta.
--  Lo script e' rieseguibile: usa "if not exists" dove possibile.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PROFILI E RUOLI
--   admin  : puo' fare tutto, compresa la gestione degli utenti
--   editor : puo' inserire/modificare dati (squadre, partite, referti...)
--   user   : solo lettura (default per chi si registra)
-- Il PRIMO utente che si registra diventa automaticamente admin.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'user' check (role in ('admin','editor','user')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when not exists (select 1 from public.profiles) then 'admin' else 'user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'));
$$;

-- ---------------------------------------------------------------------
-- DATI SPORTIVI
-- ---------------------------------------------------------------------
create table if not exists public.seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- es. 2026/2027
  start_date  date,
  end_date    date,
  is_current  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  address     text,
  surface     text,                          -- erba naturale / sintetica / terra
  capacity    int,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  short_name    text,
  city          text,
  province      text,                        -- sigla, es. TV
  region        text,
  founded_year  int,
  colors        text,
  logo_url      text,
  president     text,
  coach         text,
  phone         text,
  email         text,
  website       text,
  venue_id      uuid references public.venues(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.competitions (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references public.seasons(id) on delete cascade,
  name         text not null,                -- es. Prima Categoria Girone D
  category     text,                         -- Eccellenza, Promozione, ...
  level        text not null default 'provinciale' check (level in ('regionale','provinciale')),
  region       text,
  province     text,
  points_win   int not null default 3,
  points_draw  int not null default 1,
  points_loss  int not null default 0,
  created_at   timestamptz not null default now()
);

-- Squadre iscritte a un campionato (+ eventuali punti di penalizzazione)
create table if not exists public.competition_teams (
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  penalty_points  int not null default 0,
  primary key (competition_id, team_id)
);

create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  birth_date      date,
  role            text check (role in ('Portiere','Difensore','Centrocampista','Attaccante')),
  shirt_number    int,
  team_id         uuid references public.teams(id) on delete set null,
  nationality     text,
  foot            text,
  height_cm       int,
  license_number  text,
  photo_url       text,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  matchday       int,
  home_team_id   uuid not null references public.teams(id) on delete cascade,
  away_team_id   uuid not null references public.teams(id) on delete cascade,
  venue_id       uuid references public.venues(id) on delete set null,
  kickoff        timestamptz,
  home_score     int,
  away_score     int,
  status         text not null default 'scheduled'
                 check (status in ('scheduled','played','postponed','cancelled')),
  referee        text,
  notes          text,
  created_at     timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

-- Eventi del referto: gol, rigori, autogol, ammonizioni, espulsioni
create table if not exists public.match_events (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  player_id   uuid references public.players(id) on delete set null,
  minute      int,
  type        text not null check (type in ('goal','penalty','own_goal','yellow','red')),
  created_at  timestamptz not null default now()
);

create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  image_url     text,
  published     boolean not null default true,
  published_at  timestamptz not null default now(),
  author_id     uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_matches_comp_day  on public.matches (competition_id, matchday);
create index if not exists idx_matches_home      on public.matches (home_team_id);
create index if not exists idx_matches_away      on public.matches (away_team_id);
create index if not exists idx_events_match      on public.match_events (match_id);
create index if not exists idx_events_player     on public.match_events (player_id);
create index if not exists idx_players_team      on public.players (team_id);
create index if not exists idx_comp_season       on public.competitions (season_id);

-- ---------------------------------------------------------------------
-- SICUREZZA (Row Level Security)
--   Lettura pubblica dei dati sportivi; scrittura solo per admin/editor.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profilo proprio o admin" on public.profiles;
create policy "profilo proprio o admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "admin modifica profili" on public.profiles;
create policy "admin modifica profili" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin elimina profili" on public.profiles;
create policy "admin elimina profili" on public.profiles
  for delete using (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array[
    'seasons','venues','teams','competitions','competition_teams',
    'players','matches','match_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lettura pubblica" on public.%I', t);
    execute format('create policy "lettura pubblica" on public.%I for select using (true)', t);
    execute format('drop policy if exists "scrittura staff" on public.%I', t);
    execute format('create policy "scrittura staff" on public.%I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

alter table public.news enable row level security;
drop policy if exists "news pubbliche" on public.news;
create policy "news pubbliche" on public.news
  for select using (published or public.is_staff());
drop policy if exists "news scrittura staff" on public.news;
create policy "news scrittura staff" on public.news
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- STORAGE per loghi, foto giocatori e immagini news
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media lettura" on storage.objects;
create policy "media lettura" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media inserimento staff" on storage.objects;
create policy "media inserimento staff" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "media modifica staff" on storage.objects;
create policy "media modifica staff" on storage.objects
  for update using (bucket_id = 'media' and public.is_staff());

drop policy if exists "media eliminazione staff" on storage.objects;
create policy "media eliminazione staff" on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());
