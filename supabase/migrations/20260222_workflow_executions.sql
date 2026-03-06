-- Create workflow_executions table to track paused workflow state
-- Used for auth detection: when an auth wall is hit, execution pauses here
-- and resumes after the user authenticates via Browserbase

create table if not exists public.workflow_executions (
  id                    uuid primary key default gen_random_uuid(),
  workflow_id           uuid not null references public.workflows(id) on delete cascade,
  user_id               uuid not null references public.user_profiles(id) on delete cascade,
  browserbase_session_id text not null,       -- The live Browserbase session ID (kept open during auth)
  chat_session_id       text not null,        -- To send resume messages back to the right chat
  paused_at_step        int  not null,        -- Step index to resume from (0-indexed)
  variables             jsonb default '{}',   -- Interpolated variables for resume
  status                text not null default 'paused', -- 'paused'|'running'|'done'|'failed'|'expired'
  context_id            text,                 -- Browserbase Context ID (may be null on first run)
  connect_url           text,                 -- connectUrl shown to user for login
  expires_at            timestamptz not null, -- Paused session expires after 10 minutes
  created_at            timestamptz not null default now()
);

-- RLS: users can only see their own executions
alter table public.workflow_executions enable row level security;

create policy "Users can view own executions"
  on public.workflow_executions for select
  using (auth.uid() = user_id);

create policy "Users can insert own executions"
  on public.workflow_executions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own executions"
  on public.workflow_executions for update
  using (auth.uid() = user_id);

-- Index for fast lookup by user
create index if not exists idx_workflow_executions_user_id
  on public.workflow_executions (user_id);
