-- Player registration, payments, club officials, and game-day rosters

create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Link teams to clubs (a club can have multiple teams across divisions)
alter table teams add column club_id uuid references clubs(id);
create index teams_club_id_idx on teams(club_id);

create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  club_id uuid not null references clubs(id),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  season_id uuid not null references seasons(id),
  division_id uuid not null references divisions(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  fee_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique (player_id, season_id, division_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id),
  amount_cents integer not null,
  gateway_ref text not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Club officials who can assign rosters
create table club_officials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  club_id uuid not null references clubs(id),
  role text not null default 'selector' check (role in ('selector', 'manager', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);

-- Game-day roster assignments
create table game_rosters (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id),
  team_id uuid not null references teams(id),
  player_id uuid not null references players(id),
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now(),
  unique (game_id, team_id, player_id)
);

create index game_rosters_game_id_idx on game_rosters(game_id);

-- RLS
alter table clubs enable row level security;
alter table players enable row level security;
alter table registrations enable row level security;
alter table payments enable row level security;
alter table club_officials enable row level security;
alter table game_rosters enable row level security;

-- Public read
create policy "clubs_public_read" on clubs for select to anon, authenticated using (true);
create policy "game_rosters_public_read" on game_rosters for select to anon, authenticated using (true);

-- Players can see their own data
create policy "players_own_read" on players for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "players_own_insert" on players for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Registrations: player can see/create their own
create policy "registrations_own_read" on registrations for select to authenticated
  using (player_id in (select id from players where user_id = (select auth.uid())));
create policy "registrations_own_insert" on registrations for insert to authenticated
  with check (player_id in (select id from players where user_id = (select auth.uid())));

-- Payments: player can see their own
create policy "payments_own_read" on payments for select to authenticated
  using (registration_id in (
    select r.id from registrations r
    join players p on p.id = r.player_id
    where p.user_id = (select auth.uid())
  ));

-- Club officials: can see own record
create policy "club_officials_own_read" on club_officials for select to authenticated
  using ((select auth.uid()) = user_id);

-- Game rosters: club officials can insert/update for their club's teams
create policy "game_rosters_official_insert" on game_rosters for insert to authenticated
  with check (
    exists (
      select 1 from club_officials co
      join teams t on t.club_id = co.club_id
      where co.user_id = (select auth.uid())
        and t.id = team_id
    )
  );
