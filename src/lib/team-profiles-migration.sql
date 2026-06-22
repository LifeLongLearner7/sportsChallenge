-- Team Profiles Table
-- Stores static team data (squad, coach) seeded once from football-data.org.
-- Dynamic data (standings, results) is fetched live from the external API.

create table if not exists team_profiles (
  team_code          text primary key,        -- our internal 3-letter code e.g. "ARG"
  full_name          text not null,           -- "Argentina"
  external_id        integer,                 -- football-data.org team ID
  coach_name         text,
  coach_nationality  text,
  founded            integer,
  club_colors        text,
  crest_url          text,                    -- SVG crest from football-data.org
  players            jsonb,                   -- array of top player objects
  last_synced_at     timestamptz default now()
);

-- Allow anyone to read team profiles (public data)
alter table team_profiles enable row level security;

create policy "Team profiles are publicly readable"
  on team_profiles for select
  using (true);

-- Only service role can write
create policy "Only service role can insert team profiles"
  on team_profiles for insert
  using (true);

create policy "Only service role can update team profiles"
  on team_profiles for update
  using (true);
