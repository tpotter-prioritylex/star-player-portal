-- PriorityLex Star Player Training Portal - Complete Database Setup
-- Copy and paste this entire script into your Supabase SQL Editor

-- ===========================================
-- STEP 1: SCHEMA SETUP
-- ===========================================

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

-- ===========================================
-- STEP 2: ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user group
CREATE OR REPLACE FUNCTION get_user_group(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT group_id FROM users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- GROUPS TABLE POLICIES
CREATE POLICY "Users can read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert groups" ON groups
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete groups" ON groups
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- TRAINING DAYS TABLE POLICIES
CREATE POLICY "Users can read training days" ON training_days
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify training days" ON training_days
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- CURRICULUM MATERIALS TABLE POLICIES
CREATE POLICY "Users can read curriculum materials" ON curriculum_materials
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and instructor can modify curriculum materials" ON curriculum_materials
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- STUDENT UPLOADS TABLE POLICIES
CREATE POLICY "Star players can insert own uploads" ON student_uploads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    get_user_role(auth.uid()) = 'star_player' AND
    group_id = get_user_group(auth.uid())
  );

CREATE POLICY "Star players can read own uploads" ON student_uploads
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'star_player' AND auth.uid() = user_id) OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can update uploads" ON student_uploads
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

CREATE POLICY "Admin can delete uploads" ON student_uploads
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- CHAT CHANNELS TABLE POLICIES
CREATE POLICY "Users can read accessible channels" ON chat_channels
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      type IN ('cohort', 'announcement') OR
      get_user_role(auth.uid()) IN ('admin', 'instructor') OR
      (type = 'group' AND group_id = get_user_group(auth.uid()))
    )
  );

CREATE POLICY "Admin can modify channels" ON chat_channels
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- CHAT MESSAGES TABLE POLICIES
CREATE POLICY "Users can read accessible messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        chat_channels.type IN ('cohort', 'announcement') OR
        get_user_role(auth.uid()) IN ('admin', 'instructor') OR
        (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
      )
    )
  );

CREATE POLICY "Users can insert messages to accessible channels" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        chat_channels.type IN ('cohort', 'announcement') OR
        get_user_role(auth.uid()) IN ('admin', 'instructor') OR
        (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
      )
    )
  );

CREATE POLICY "Admin can update messages" ON chat_messages
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- SOP COMPETENCIES TABLE POLICIES
CREATE POLICY "Users can read own competencies" ON sop_competencies
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can modify competencies" ON sop_competencies
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- PIPELINE CERTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can read own certifications" ON pipeline_certifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can modify certifications" ON pipeline_certifications
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- ANNOUNCEMENTS TABLE POLICIES
CREATE POLICY "Users can read announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and instructor can insert announcements" ON announcements
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'instructor'));

CREATE POLICY "Admin can modify announcements" ON announcements
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete announcements" ON announcements
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===========================================
-- STEP 3: SEED DATA
-- ===========================================

-- Insert default groups (6 groups for Cohort 2)
INSERT INTO groups (id, name, cohort) VALUES
  (1, 'Group 1', 'Cohort 2'),
  (2, 'Group 2', 'Cohort 2'),
  (3, 'Group 3', 'Cohort 2'),
  (4, 'Group 4', 'Cohort 2'),
  (5, 'Group 5', 'Cohort 2'),
  (6, 'Group 6', 'Cohort 2');

-- Reset sequence to start from 7 for future groups
SELECT setval('groups_id_seq', 6);

-- Insert training days (10-day program)
INSERT INTO training_days (day_number, title, description, sop_series) VALUES
  (1, 'Quo Intake Mastery', 'Intake platform, answering trees, client communication', ARRAY['A-1', 'A-2', 'A-3']),
  (2, 'Clio Foundations', 'Matter creation, contacts, relationships', ARRAY['B-1', 'B-2']),
  (3, 'Clio Advanced', 'Tasks, calendars, document management', ARRAY['B-3', 'B-4']),
  (4, 'Claude Legal Drafting I', 'Research memos, client letters', ARRAY['C-1', 'C-2']),
  (5, 'Claude Legal Drafting II', 'Motions, contract review', ARRAY['C-3', 'C-4']),
  (6, 'Claude Legal Drafting III', 'Case summaries, quality standards', ARRAY['C-5']),
  (7, 'Midpage Research', 'Case law, statutory, verification', ARRAY['D-1', 'D-2', 'D-3']),
  (8, 'Pipeline Integration', 'End-to-end workflow across all tools', ARRAY['E-1', 'E-2', 'E-3']),
  (9, 'Quality and Review', 'Self-review, peer review protocols', ARRAY['F-1', 'F-2']),
  (10, 'Capstone and Certification', 'Integrated exercise, competency verification', ARRAY['A-1', 'A-2', 'A-3', 'B-1', 'B-2', 'B-3', 'B-4', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'D-1', 'D-2', 'D-3', 'E-1', 'E-2', 'E-3', 'F-1', 'F-2']);

-- Insert chat channels (1 cohort + 6 groups + 1 announcement = 8 channels)
INSERT INTO chat_channels (name, type, group_id) VALUES
  ('Announcements', 'announcement', NULL),
  ('Cohort Chat', 'cohort', NULL),
  ('Group 1', 'group', 1),
  ('Group 2', 'group', 2),
  ('Group 3', 'group', 3),
  ('Group 4', 'group', 4),
  ('Group 5', 'group', 5),
  ('Group 6', 'group', 6);

-- Function to create SOP competencies for a user
CREATE OR REPLACE FUNCTION create_sop_competencies_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- A Series: Quo Intake
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'A-1', 'New Client Intake'),
    (target_user_id, 'A-2', 'Returning Client Intake'),
    (target_user_id, 'A-3', 'Intake Quality Review');

  -- B Series: Clio Matter Setup
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'B-1', 'Matter Creation'),
    (target_user_id, 'B-2', 'Contact and Relationship Linking'),
    (target_user_id, 'B-3', 'Task and Calendar Setup'),
    (target_user_id, 'B-4', 'Document Organization');

  -- C Series: Claude Legal Drafting
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'C-1', 'Research Memorandum'),
    (target_user_id, 'C-2', 'Client Letter Drafting'),
    (target_user_id, 'C-3', 'Motion Drafting'),
    (target_user_id, 'C-4', 'Contract Review and Redline'),
    (target_user_id, 'C-5', 'Case Summary');

  -- D Series: Midpage Legal Research
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'D-1', 'Case Law Research'),
    (target_user_id, 'D-2', 'Statutory Research'),
    (target_user_id, 'D-3', 'Authority Verification');

  -- E Series: Pipeline Integration
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'E-1', 'Quo to Clio Handoff'),
    (target_user_id, 'E-2', 'Clio to Claude Workflow'),
    (target_user_id, 'E-3', 'Claude to Midpage Verification');

  -- F Series: Quality and Review
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'F-1', 'Self-Review Protocol'),
    (target_user_id, 'F-2', 'Peer Review Protocol');
END;
$$ LANGUAGE plpgsql;

-- Function to create pipeline certifications for a user
CREATE OR REPLACE FUNCTION create_pipeline_certifications_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Core Pipeline Tools
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Quo'),
    (target_user_id, 'Clio'),
    (target_user_id, 'Claude (with Legal Quality Standards)'),
    (target_user_id, 'Midpage');

  -- Clio Credentials
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Clio Manage Product Essentials'),
    (target_user_id, 'Clio Certified Administrator'),
    (target_user_id, 'Clio Legal AI Fundamentals');

  -- Research Platforms
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Lexis AI'),
    (target_user_id, 'Spellbook'),
    (target_user_id, 'OpenBook');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create competencies and certifications for new Star Players
CREATE OR REPLACE FUNCTION create_star_player_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create for Star Players
  IF NEW.role = 'star_player' THEN
    PERFORM create_sop_competencies_for_user(NEW.id);
    PERFORM create_pipeline_certifications_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER create_star_player_progress_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_star_player_progress();

-- ===========================================
-- STEP 4: STORAGE SETUP
-- ===========================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('curriculum-materials', 'curriculum-materials', true),
  ('student-uploads', 'student-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- CURRICULUM MATERIALS BUCKET POLICIES
CREATE POLICY "Curriculum materials are publicly readable for authenticated users"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'curriculum-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Admin and instructor can upload curriculum materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can update curriculum materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can delete curriculum materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

-- STUDENT UPLOADS BUCKET POLICIES
CREATE POLICY "Users can view accessible student uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-uploads' AND (
      get_user_role(auth.uid()) IN ('admin', 'instructor') OR
      (auth.uid()::text = (string_to_array(name, '/'))[3])
    )
  );

CREATE POLICY "Star players can upload to own directory"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3] AND
    (string_to_array(name, '/'))[1] = 'group-' || get_user_group(auth.uid())::text
  );

CREATE POLICY "Star players can update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3]
  );

CREATE POLICY "Star players can delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3]
  );

CREATE POLICY "Admin can manage all student uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Instructors can view all student uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'instructor'
  );

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================

-- Verify setup
SELECT 'Database setup complete!' as message;
SELECT 'Tables created: ' || count(*) as result FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Groups seeded: ' || count(*) as result FROM groups;
SELECT 'Training days seeded: ' || count(*) as result FROM training_days;
SELECT 'Chat channels created: ' || count(*) as result FROM chat_channels;