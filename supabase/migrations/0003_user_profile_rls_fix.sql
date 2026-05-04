alter table public.user_profiles
  drop constraint if exists user_profiles_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade;

alter table public.conversation_messages enable row level security;
alter table public.interview_turns enable row level security;
alter table public.interview_summaries enable row level security;

do $$
begin
  create policy "Users can manage own conversation messages"
    on public.conversation_messages
    for all
    using (
      exists (
        select 1
        from public.conversation_sessions sessions
        where sessions.id = conversation_messages.session_id
          and sessions.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.conversation_sessions sessions
        where sessions.id = conversation_messages.session_id
          and sessions.user_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own interview turns"
    on public.interview_turns
    for all
    using (
      exists (
        select 1
        from public.interview_sessions sessions
        where sessions.id = interview_turns.interview_session_id
          and sessions.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.interview_sessions sessions
        where sessions.id = interview_turns.interview_session_id
          and sessions.user_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can manage own interview summaries"
    on public.interview_summaries
    for all
    using (
      exists (
        select 1
        from public.interview_sessions sessions
        where sessions.id = interview_summaries.interview_session_id
          and sessions.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.interview_sessions sessions
        where sessions.id = interview_summaries.interview_session_id
          and sessions.user_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;
