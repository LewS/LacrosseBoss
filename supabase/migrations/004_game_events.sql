-- Game events: goals, assists, fouls (per World Lacrosse Men's Field Rules 2025-27)
-- Supports: technical fouls (30s), personal fouls (1-3 min, 3 min = ejection + reporting)
-- Supports: simultaneous fouls linked by group_id

create table game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id),
  player_id uuid references players(id),
  event_type text not null check (event_type in ('goal', 'foul')),
  -- Goal fields
  assisted_by uuid references players(id),
  -- Foul fields
  foul_category text check (foul_category in ('technical', 'personal')),
  foul_reason text, -- specific foul type from dropdown
  penalty_seconds integer, -- 30 for technical, 60/120/180 for personal
  ejected boolean not null default false, -- true when 3-min personal = ejection
  -- Simultaneous fouls share the same group_id
  simultaneous_group_id uuid,
  -- Game context
  period integer not null,
  game_clock_seconds integer,
  created_at timestamptz not null default now(),
  -- Constraints
  constraint goal_no_foul_fields check (
    event_type != 'goal' or (foul_category is null and penalty_seconds is null)
  ),
  constraint foul_has_category check (
    event_type != 'foul' or foul_category is not null
  ),
  constraint technical_30s check (
    foul_category != 'technical' or penalty_seconds = 30
  ),
  constraint personal_min_60s check (
    foul_category != 'personal' or penalty_seconds in (60, 120, 180)
  ),
  constraint ejection_is_3min check (
    not ejected or (foul_category = 'personal' and penalty_seconds = 180)
  )
);

create index game_events_game_id_idx on game_events(game_id);
create index game_events_player_id_idx on game_events(player_id);
create index game_events_simultaneous_idx on game_events(simultaneous_group_id) where simultaneous_group_id is not null;

alter table game_events enable row level security;

create policy "game_events_public_read" on game_events for select to anon, authenticated using (true);
create policy "game_events_auth_insert" on game_events for insert to authenticated with check (true);
create policy "game_events_auth_update" on game_events for update to authenticated using (true) with check (true);
create policy "game_events_auth_delete" on game_events for delete to authenticated using (true);
