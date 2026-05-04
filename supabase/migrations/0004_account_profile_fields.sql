alter table public.user_profiles
  add column if not exists username text unique,
  add column if not exists basic_info jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.resumes
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_resumes_user_created_at
  on public.resumes(user_id, created_at desc);
