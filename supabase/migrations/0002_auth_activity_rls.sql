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

create index if not exists idx_user_activity_records_user_type
  on public.user_activity_records(user_id, record_type, updated_at desc);

alter table public.user_activity_records enable row level security;

alter table public.user_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.recommendation_results enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.resume_optimization_results enable row level security;

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
  create policy "Users can manage own candidate profiles"
    on public.candidate_profiles
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own conversation sessions"
    on public.conversation_sessions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own recommendations"
    on public.recommendation_results
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own interview sessions"
    on public.interview_sessions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own resume optimizations"
    on public.resume_optimization_results
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;
