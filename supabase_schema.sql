-- World Janken League - Database Schema

-- Users
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  country text,
  area text,
  language text not null default 'ja',
  avatar_id text,
  rating integer not null default 1000,
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seasons
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'ended')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid references public.users not null,
  player2_id uuid references public.users not null,
  winner_id uuid references public.users,
  match_format text not null default 'BO1' check (match_format in ('BO1', 'BO3', 'BO5')),
  player1_rating_before integer not null,
  player1_rating_after integer,
  player2_rating_before integer not null,
  player2_rating_after integer,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Match Rounds
create table public.match_rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches on delete cascade not null,
  round_number integer not null,
  player1_move text check (player1_move in ('rock', 'scissors', 'paper')),
  player2_move text check (player2_move in ('rock', 'scissors', 'paper')),
  result text check (result in ('player1_win', 'player2_win', 'draw')),
  created_at timestamptz not null default now(),
  unique (match_id, round_number)
);

-- Tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons,
  title text not null,
  format text not null default 'single_elimination' check (format in ('single_elimination', 'swiss')),
  match_format text not null default 'BO1' check (match_format in ('BO1', 'BO3', 'BO5')),
  status text not null default 'upcoming' check (status in ('upcoming', 'entry_open', 'in_progress', 'completed')),
  prize_pool integer not null default 0,
  max_participants integer not null default 16,
  min_rating integer,
  entry_requires_login boolean not null default true,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Tournament Entries
create table public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments on delete cascade not null,
  user_id uuid references public.users not null,
  seed_rating integer not null,
  result_rank integer,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

-- Tournament Rounds
create table public.tournament_rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments on delete cascade not null,
  round_number integer not null,
  round_name text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  unique (tournament_id, round_number)
);

-- Tournament Matches (bracket)
create table public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments on delete cascade not null,
  tournament_round_id uuid references public.tournament_rounds on delete cascade not null,
  bracket_position integer not null,
  match_id uuid references public.matches,
  player1_id uuid references public.users,
  player2_id uuid references public.users,
  winner_id uuid references public.users,
  created_at timestamptz not null default now(),
  unique (tournament_round_id, bracket_position)
);

-- Ad Rewards
create table public.ad_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  ad_type text not null,
  reward_type text not null,
  amount integer not null default 0,
  tournament_id uuid references public.tournaments,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.match_rounds enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.tournament_rounds enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.seasons enable row level security;
alter table public.ad_rewards enable row level security;

-- RLS Policies: users
create policy "users are viewable by everyone" on public.users for select using (true);
create policy "users can update own profile" on public.users for update using (auth.uid() = id);
create policy "users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- RLS Policies: matches
create policy "matches are viewable by everyone" on public.matches for select using (true);
create policy "players can insert matches" on public.matches for insert with check (auth.uid() = player1_id or auth.uid() = player2_id);
create policy "players can update own matches" on public.matches for update using (auth.uid() = player1_id or auth.uid() = player2_id);

-- RLS Policies: match_rounds
create policy "match rounds are viewable by everyone" on public.match_rounds for select using (true);
create policy "players can insert rounds" on public.match_rounds for insert with check (
  exists (select 1 from public.matches where id = match_id and (player1_id = auth.uid() or player2_id = auth.uid()))
);

-- RLS Policies: tournaments / rounds / matches (public read)
create policy "tournaments are viewable by everyone" on public.tournaments for select using (true);
create policy "tournament entries are viewable by everyone" on public.tournament_entries for select using (true);
create policy "tournament rounds are viewable by everyone" on public.tournament_rounds for select using (true);
create policy "tournament matches are viewable by everyone" on public.tournament_matches for select using (true);
create policy "seasons are viewable by everyone" on public.seasons for select using (true);

-- tournament entry by logged-in user
create policy "logged-in users can enter tournaments" on public.tournament_entries for insert with check (
  auth.uid() = user_id and
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.entry_requires_login = true)
);

-- Matchmaking Queue
create table public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null unique,
  rating integer not null,
  match_format text not null default 'BO1' check (match_format in ('BO1', 'BO3', 'BO5')),
  created_at timestamptz not null default now()
);

alter table public.matchmaking_queue enable row level security;
create policy "players can manage own queue entry" on public.matchmaking_queue
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "players can view queue" on public.matchmaking_queue for select using (true);

-- Indexes
create index on public.users (rating desc);
create index on public.users (country);
create index on public.users (area);
create index on public.matches (player1_id);
create index on public.matches (player2_id);
create index on public.matches (status);
create index on public.match_rounds (match_id);
create index on public.tournament_entries (tournament_id);
create index on public.tournament_matches (tournament_id);
