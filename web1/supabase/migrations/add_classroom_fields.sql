-- Add Google Classroom fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS classroom_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_classroom_email TEXT,
ADD COLUMN IF NOT EXISTS classroom_connected_at TIMESTAMPTZ;

-- Create table to cache classroom activities for performance
CREATE TABLE IF NOT EXISTS classroom_activities (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('assignment', 'announcement', 'grade')),
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  submission_state TEXT,
  grade NUMERIC,
  max_points NUMERIC,
  is_late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classroom_activities_user_id ON classroom_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_type ON classroom_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_due_date ON classroom_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_updated ON classroom_activities(updated_at DESC);

-- Enable RLS
ALTER TABLE classroom_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own classroom activities"
  ON classroom_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classroom activities"
  ON classroom_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classroom activities"
  ON classroom_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classroom activities"
  ON classroom_activities FOR DELETE
  USING (auth.uid() = user_id);