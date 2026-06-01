-- LacrosseBoss schema
-- Teams, games, scoring, and standings for lacrosse scheduling
-- Supports age brackets (juniors through adults) and gender divisions

create table divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  age_bracket text not null,
  gender text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  division_id uuid not null references divisions(id),
  color text,
  logo_url text,
  created_at timestamptz not null default now(),
  unique (name, division_id)
);

create index teams_division_id_idx on teams(division_id);

create table games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  division_id uuid not null references divisions(id),
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  scheduled_at timestamptz not null,
  location text,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'final', 'cancelled', 'postponed')),
  home_score integer not null default 0,
  away_score integer not null default 0,
  period integer not null default 0,
  created_at timestamptz not null default now(),
  constraint different_teams check (home_team_id != away_team_id)
);

create index games_season_id_idx on games(season_id);
create index games_division_id_idx on games(division_id);
create index games_scheduled_at_idx on games(scheduled_at);
create index games_status_idx on games(status);

-- Standings view per division
create view standings as
select
  s.id as season_id,
  d.id as division_id,
  d.name as division_name,
  d.age_bracket,
  d.gender,
  t.id as team_id,
  t.name as team_name,
  t.short_name,
  count(*) filter (where
    (g.home_team_id = t.id and g.home_score > g.away_score) or
    (g.away_team_id = t.id and g.away_score > g.home_score)
  ) as wins,
  count(*) filter (where
    (g.home_team_id = t.id and g.home_score < g.away_score) or
    (g.away_team_id = t.id and g.away_score < g.home_score)
  ) as losses,
  count(*) filter (where g.home_score = g.away_score) as ties,
  (count(*) filter (where
    (g.home_team_id = t.id and g.home_score > g.away_score) or
    (g.away_team_id = t.id and g.away_score > g.home_score)
  ) * 2 + count(*) filter (where g.home_score = g.away_score)) as points
from teams t
join divisions d on d.id = t.division_id
cross join seasons s
left join games g on (g.home_team_id = t.id or g.away_team_id = t.id)
  and g.season_id = s.id
  and g.status = 'final'
group by s.id, d.id, d.name, d.age_bracket, d.gender, t.id, t.name, t.short_name;

-- RLS policies
alter table competitions enable row level security;
alter table divisions enable row level security;
alter table teams enable row level security;
alter table seasons enable row level security;
alter table games enable row level security;

-- Public read access
create policy "competitions_public_read" on competitions for select to anon, authenticated using (true);
create policy "divisions_public_read" on divisions for select to anon, authenticated using (true);
create policy "teams_public_read" on teams for select to anon, authenticated using (true);
create policy "seasons_public_read" on seasons for select to anon, authenticated using (true);
create policy "games_public_read" on games for select to anon, authenticated using (true);

-- Authenticated write (admin)
create policy "competitions_auth_insert" on competitions for insert to authenticated with check (true);
create policy "competitions_auth_update" on competitions for update to authenticated using (true) with check (true);
create policy "divisions_auth_insert" on divisions for insert to authenticated with check (true);
create policy "divisions_auth_update" on divisions for update to authenticated using (true) with check (true);
create policy "teams_auth_insert" on teams for insert to authenticated with check (true);
create policy "teams_auth_update" on teams for update to authenticated using (true) with check (true);
create policy "seasons_auth_insert" on seasons for insert to authenticated with check (true);
create policy "seasons_auth_update" on seasons for update to authenticated using (true) with check (true);
create policy "games_auth_insert" on games for insert to authenticated with check (true);
create policy "games_auth_update" on games for update to authenticated using (true) with check (true);
