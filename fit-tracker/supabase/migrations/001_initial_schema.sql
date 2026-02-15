-- ============================================================
-- Onset Fitness — Initial Schema
-- 5 tables (JSONB document sync) + 1 storage bucket
-- ============================================================

-- ─── Helper: auto-update updated_at ───

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── Helper: auto-create profile on signup ───

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 1. PROFILES
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  user_profile jsonb default '{}'::jsonb,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile row on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- 2. WORKOUT_DATA
-- ============================================================

create table public.workout_data (
  user_id         uuid primary key references auth.users on delete cascade,
  custom_workouts jsonb default '[]'::jsonb,
  history         jsonb default '[]'::jsonb,
  stats           jsonb default '{}'::jsonb,
  muscle_order    jsonb default '[]'::jsonb,
  home_card_order jsonb default '[]'::jsonb,
  updated_at      timestamptz default now()
);

create trigger workout_data_updated_at
  before update on public.workout_data
  for each row execute function public.handle_updated_at();

alter table public.workout_data enable row level security;

create policy "Users can read own workout data"
  on public.workout_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout data"
  on public.workout_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout data"
  on public.workout_data for update
  using (auth.uid() = user_id);

-- GIN index for querying inside history JSONB
create index idx_workout_data_history on public.workout_data using gin (history);

-- ============================================================
-- 3. PROGRAM_DATA
-- ============================================================

create table public.program_data (
  user_id      uuid primary key references auth.users on delete cascade,
  program      jsonb default null,
  active_state jsonb default null,
  updated_at   timestamptz default now()
);

create trigger program_data_updated_at
  before update on public.program_data
  for each row execute function public.handle_updated_at();

alter table public.program_data enable row level security;

create policy "Users can read own program data"
  on public.program_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own program data"
  on public.program_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own program data"
  on public.program_data for update
  using (auth.uid() = user_id);

-- ============================================================
-- 4. BADGE_DATA
-- ============================================================

create table public.badge_data (
  user_id          uuid primary key references auth.users on delete cascade,
  unlocked_badges  jsonb default '{}'::jsonb,
  previous_points  integer default 0,
  updated_at       timestamptz default now()
);

create trigger badge_data_updated_at
  before update on public.badge_data
  for each row execute function public.handle_updated_at();

alter table public.badge_data enable row level security;

create policy "Users can read own badge data"
  on public.badge_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own badge data"
  on public.badge_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own badge data"
  on public.badge_data for update
  using (auth.uid() = user_id);

-- GIN index on unlocked_badges
create index idx_badge_data_unlocked on public.badge_data using gin (unlocked_badges);

-- ============================================================
-- 5. SETTINGS
-- ============================================================

create table public.settings (
  user_id          uuid primary key references auth.users on delete cascade,
  sound_enabled    boolean default true,
  voice_enabled    boolean default true,
  sound_volume     real default 0.8,
  weight_unit      text default 'kg' check (weight_unit in ('kg', 'lbs')),
  language         text default 'fr' check (language in ('fr', 'en')),
  keep_screen_awake boolean default true,
  updated_at       timestamptz default now()
);

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.handle_updated_at();

alter table public.settings enable row level security;

create policy "Users can read own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- ============================================================
-- 6. STORAGE BUCKET: Avatars
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS: users can manage their own folder (avatars/{user_id}/*)
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
