create extension if not exists vector;

create table if not exists public.user_profiles (
  id uuid primary key,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  hero_role text not null default 'AI 产品经理',
  base_profile jsonb not null,
  capability_tags jsonb not null,
  ai_pm_fit jsonb not null,
  profile_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  profile_id uuid references public.candidate_profiles(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id text primary key,
  name text not null,
  slug text unique not null,
  category text not null,
  logo_mark text not null
);

create table if not exists public.job_leads (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  role_name text not null,
  title text not null,
  city text not null,
  seniority text not null,
  source_confidence integer not null,
  summary text not null,
  extracted_requirements jsonb not null,
  recommendation_reasons jsonb not null,
  risk_reminder text not null,
  salary_band text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.xhs_posts (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  role_id text not null references public.job_leads(id) on delete cascade,
  title text not null,
  excerpt text not null,
  source_url text,
  publish_time date not null,
  author_name text not null,
  topic text not null,
  stage text not null,
  ocr_text text not null default '',
  confidence_label text not null default '高置信岗位线索',
  created_at timestamptz not null default now()
);

create table if not exists public.post_chunks (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.xhs_posts(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  tags jsonb not null default '{}'::jsonb,
  embedding vector(1536)
);

create table if not exists public.recommendation_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  profile_id uuid references public.candidate_profiles(id) on delete set null,
  job_lead_id text not null references public.job_leads(id) on delete cascade,
  score integer not null,
  reasons jsonb not null,
  risk jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  job_lead_id text not null references public.job_leads(id) on delete cascade,
  profile_id uuid references public.candidate_profiles(id) on delete set null,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references public.interview_sessions(id) on delete cascade,
  phase text not null,
  question text not null,
  answer text,
  feedback text,
  score jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_summaries (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references public.interview_sessions(id) on delete cascade,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_optimization_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  job_lead_id text not null references public.job_leads(id) on delete cascade,
  profile_id uuid references public.candidate_profiles(id) on delete set null,
  optimization jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_candidate_profiles_user_id on public.candidate_profiles(user_id);
create index if not exists idx_xhs_posts_company_role on public.xhs_posts(company_id, role_id);
create index if not exists idx_post_chunks_post_id on public.post_chunks(post_id);
create index if not exists idx_recommendation_results_user_id on public.recommendation_results(user_id);
create index if not exists idx_interview_sessions_user_id on public.interview_sessions(user_id);
