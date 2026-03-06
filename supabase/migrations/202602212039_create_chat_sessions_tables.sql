-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We index organization_id and user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_org_user ON public.chat_sessions(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

-- Enable RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions within their organization
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions FOR SELECT 
USING (
    user_id = auth.uid() 
    AND organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert their own chat sessions
CREATE POLICY "Users can insert their own chat sessions" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (
    user_id = auth.uid() 
    AND organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- Policy: Users can update their own chat sessions
CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions FOR UPDATE 
USING (
    user_id = auth.uid() 
    AND organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- Policy: Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions FOR DELETE 
USING (
    user_id = auth.uid() 
    AND organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    action JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index the chat_messages session_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Note: Because chat_messages enforces a strict foreign key to chat_sessions,
-- and chat_sessions has strict RLS, we want to enforce RLS on messages based on session ownership.

-- Policy: Users can view messages of sessions they own
CREATE POLICY "Users can view messages of their sessions" 
ON public.chat_messages FOR SELECT 
USING (
    session_id IN (
        SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert messages to sessions they own
CREATE POLICY "Users can insert messages to their sessions" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
    session_id IN (
        SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
);

-- Policy: Users can delete messages of sessions they own (needed for "clear history" type actions if we want individual message clears, or cascade handles it)
CREATE POLICY "Users can delete messages of their sessions" 
ON public.chat_messages FOR DELETE 
USING (
    session_id IN (
        SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
);
