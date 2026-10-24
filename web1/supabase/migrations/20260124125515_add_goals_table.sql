-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Other',
  deadline DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'medium',
  estimated_time TEXT,
  course TEXT,
  archived BOOLEAN DEFAULT false,
  ai_rating JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own goals" ON public.goals 
  FOR ALL USING (auth.uid() = user_id);