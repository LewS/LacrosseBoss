-- Fixture scheduling support: rounds and byes

-- Add round number to games for fixture ordering
alter table games add column round integer;
create index games_round_idx on games(season_id, division_id, round);

-- Competition-wide bye weeks (no games for any team in that division/season)
create table bye_weeks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  division_id uuid references divisions(id),
  round integer not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (season_id, division_id, round)
);

-- Team-specific byes (individual team has no game in a round)
create table team_byes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  division_id uuid not null references divisions(id),
  team_id uuid not null references teams(id),
  round integer not null,
  created_at timestamptz not null default now(),
  unique (season_id, division_id, team_id, round)
);

alter table bye_weeks enable row level security;
alter table team_byes enable row level security;

create policy "bye_weeks_public_read" on bye_weeks for select to anon, authenticated using (true);
create policy "bye_weeks_auth_insert" on bye_weeks for insert to authenticated with check (true);
create policy "bye_weeks_auth_update" on bye_weeks for update to authenticated using (true) with check (true);
create policy "bye_weeks_auth_delete" on bye_weeks for delete to authenticated using (true);

create policy "team_byes_public_read" on team_byes for select to anon, authenticated using (true);
create policy "team_byes_auth_insert" on team_byes for insert to authenticated with check (true);
create policy "team_byes_auth_update" on team_byes for update to authenticated using (true) with check (true);
create policy "team_byes_auth_delete" on team_byes for delete to authenticated using (true);
