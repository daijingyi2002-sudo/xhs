create extension if not exists vector;

create table if not exists public.user_profiles (
  id uuid primary key,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists username text unique,
  add column if not exists basic_info jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_profiles
  drop constraint if exists user_profiles_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade;

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_url text,
  parse_status text not null default 'pending',
  raw_text text,
  created_at timestamptz not null default now()
);

alter table public.resumes
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_type text not null,
  record_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, record_type, record_key)
);

create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resumes_user_created_at on public.resumes(user_id, created_at desc);
create index if not exists idx_user_activity_records_user_type
  on public.user_activity_records(user_id, record_type, updated_at desc);

alter table public.user_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.user_activity_records enable row level security;

do $$
begin
  create policy "Users can manage own profile"
    on public.user_profiles
    for all
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own resumes"
    on public.resumes
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own activity records"
    on public.user_activity_records
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
