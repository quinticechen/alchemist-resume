
-- This migration creates a table to store AI chat conversations
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.resume_analyses(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    section TEXT,
    suggestion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for the table
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own chat messages
CREATE POLICY "Users can read their own chat messages"
ON public.ai_chat_messages
FOR SELECT
USING (
    analysis_id IN (
        SELECT id FROM public.resume_analyses
        WHERE user_id = auth.uid()
    )
);

-- Create policy to allow users to insert their own chat messages
CREATE POLICY "Users can insert their own chat messages"
ON public.ai_chat_messages
FOR INSERT
WITH CHECK (
    analysis_id IN (
        SELECT id FROM public.resume_analyses
        WHERE user_id = auth.uid()
    )
);

-- Add updated_at trigger
CREATE TRIGGER update_ai_chat_messages_updated_at
BEFORE UPDATE ON public.ai_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX ai_chat_messages_analysis_id_idx ON public.ai_chat_messages (analysis_id);
