-- Add schedule table for training schedule management
-- Run this in your Supabase SQL Editor

CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id INTEGER REFERENCES training_days(id) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  location TEXT,
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read schedule slots" ON schedule_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify schedule slots" ON schedule_slots
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Add updated_at trigger
CREATE TRIGGER update_schedule_slots_updated_at BEFORE UPDATE ON schedule_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_schedule_slots_day_id ON schedule_slots(day_id);
CREATE INDEX idx_schedule_slots_start_time ON schedule_slots(start_time);