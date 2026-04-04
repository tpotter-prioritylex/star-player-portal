-- PriorityLex Star Player Training Portal Database Schema
-- Migration 001: Core Tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'star_player')),
  group_id INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Groups table
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cohort TEXT DEFAULT 'Cohort 2',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint after groups table is created
ALTER TABLE users ADD CONSTRAINT users_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id);

-- Training days table
CREATE TABLE training_days (
  id SERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  sop_series TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curriculum materials table
CREATE TABLE curriculum_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id INTEGER REFERENCES training_days(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  sop_reference TEXT,
  practice_area TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student uploads table
CREATE TABLE student_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  group_id INTEGER REFERENCES groups(id) NOT NULL,
  day_id INTEGER REFERENCES training_days(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'revision_needed', 'approved')),
  reviewer_id UUID REFERENCES users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat channels table
CREATE TABLE chat_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cohort', 'group', 'announcement')),
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id INTEGER REFERENCES chat_channels(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SOP competencies table
CREATE TABLE sop_competencies (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  sop_code TEXT NOT NULL,
  sop_title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'demonstrated', 'verified')),
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sop_code)
);

-- Pipeline certifications table
CREATE TABLE pipeline_certifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  certification TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, certification)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_curriculum_materials_day_id ON curriculum_materials(day_id);
CREATE INDEX idx_student_uploads_user_id ON student_uploads(user_id);
CREATE INDEX idx_student_uploads_group_id ON student_uploads(group_id);
CREATE INDEX idx_student_uploads_day_id ON student_uploads(day_id);
CREATE INDEX idx_student_uploads_status ON student_uploads(status);
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_sop_competencies_user_id ON sop_competencies(user_id);
CREATE INDEX idx_pipeline_certifications_user_id ON pipeline_certifications(user_id);
CREATE INDEX idx_announcements_pinned ON announcements(pinned);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sop_competencies_updated_at BEFORE UPDATE ON sop_competencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_certifications_updated_at BEFORE UPDATE ON pipeline_certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();