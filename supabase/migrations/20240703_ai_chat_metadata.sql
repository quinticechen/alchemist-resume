
-- Create a table to store OpenAI thread and run metadata
CREATE TABLE IF NOT EXISTS public.ai_chat_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.resume_analyses(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    assistant_id TEXT NOT NULL,
    section TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ai_chat_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own chat metadata
CREATE POLICY "Users can read their own chat metadata"
ON public.ai_chat_metadata
FOR SELECT
USING (
    analysis_id IN (
        SELECT id FROM public.resume_analyses
        WHERE user_id = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_chat_metadata_updated_at
BEFORE UPDATE ON public.ai_chat_metadata
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX ai_chat_metadata_analysis_id_idx ON public.ai_chat_metadata (analysis_id);
CREATE INDEX ai_chat_metadata_thread_id_idx ON public.ai_chat_metadata (thread_id);

-- Add thread_id column to ai_chat_messages for linking
ALTER TABLE public.ai_chat_messages ADD COLUMN IF NOT EXISTS thread_id TEXT;
CREATE INDEX IF NOT EXISTS ai_chat_messages_thread_id_idx ON public.ai_chat_messages (thread_id);
