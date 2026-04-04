-- PriorityLex Star Player Training Portal - COMPLETE Database Setup
-- Run this entire script in your Supabase SQL Editor to set up everything

-- ===========================================
-- STEP 1: EXTENSIONS AND CORE SCHEMA
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'star_player')),
  group_id INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cohort TEXT DEFAULT 'Cohort 2',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'users_group_id_fkey') THEN
    ALTER TABLE users ADD CONSTRAINT users_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES groups(id);
  END IF;
END $$;

-- Training days table
CREATE TABLE IF NOT EXISTS training_days (
  id SERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  sop_series TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule slots table
CREATE TABLE IF NOT EXISTS schedule_slots (
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

-- Curriculum materials table
CREATE TABLE IF NOT EXISTS curriculum_materials (
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
CREATE TABLE IF NOT EXISTS student_uploads (
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
CREATE TABLE IF NOT EXISTS chat_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cohort', 'group', 'announcement')),
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id INTEGER REFERENCES chat_channels(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SOP competencies table
CREATE TABLE IF NOT EXISTS sop_competencies (
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
CREATE TABLE IF NOT EXISTS pipeline_certifications (
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
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule slots table
CREATE TABLE IF NOT EXISTS schedule_slots (
  id BIGSERIAL PRIMARY KEY,
  day_id INTEGER REFERENCES training_days(id) ON DELETE CASCADE,
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

-- Create indexes for performance
DO $$
BEGIN
  -- Check and create indexes only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
    CREATE INDEX idx_users_role ON users(role);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_group_id') THEN
    CREATE INDEX idx_users_group_id ON users(group_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schedule_slots_day_id') THEN
    CREATE INDEX idx_schedule_slots_day_id ON schedule_slots(day_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_curriculum_materials_day_id') THEN
    CREATE INDEX idx_curriculum_materials_day_id ON curriculum_materials(day_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_uploads_user_id') THEN
    CREATE INDEX idx_student_uploads_user_id ON student_uploads(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_channel_id') THEN
    CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sop_competencies_user_id') THEN
    CREATE INDEX idx_sop_competencies_user_id ON sop_competencies(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pipeline_certifications_user_id') THEN
    CREATE INDEX idx_pipeline_certifications_user_id ON pipeline_certifications(user_id);
  END IF;
END $$;

-- ===========================================
-- STEP 2: TRIGGER FUNCTIONS
-- ===========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_slots_updated_at ON schedule_slots;
CREATE TRIGGER update_schedule_slots_updated_at BEFORE UPDATE ON schedule_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sop_competencies_updated_at ON sop_competencies;
CREATE TRIGGER update_sop_competencies_updated_at BEFORE UPDATE ON sop_competencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_certifications_updated_at ON pipeline_certifications;
CREATE TRIGGER update_pipeline_certifications_updated_at BEFORE UPDATE ON pipeline_certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- STEP 3: ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
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

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- USERS TABLE POLICIES
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (
    NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- GROUPS TABLE POLICIES
CREATE POLICY "Users can read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify groups" ON groups
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- TRAINING DAYS AND SCHEDULE POLICIES
CREATE POLICY "Users can read training days" ON training_days
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify training days" ON training_days
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read schedule slots" ON schedule_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify schedule slots" ON schedule_slots
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- CURRICULUM MATERIALS POLICIES
CREATE POLICY "Users can read curriculum materials" ON curriculum_materials
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and instructor can modify curriculum materials" ON curriculum_materials
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- STUDENT UPLOADS POLICIES
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

-- CHAT POLICIES
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

-- PROGRESS TRACKING POLICIES
CREATE POLICY "Users can read own competencies" ON sop_competencies
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can modify competencies" ON sop_competencies
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

CREATE POLICY "Users can read own certifications" ON pipeline_certifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can modify certifications" ON pipeline_certifications
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Users can read announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and instructor can insert announcements" ON announcements
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'instructor'));

CREATE POLICY "Admin can modify announcements" ON announcements
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete announcements" ON announcements
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===========================================
-- STEP 4: SEED DATA
-- ===========================================

-- Insert default groups (6 groups for Cohort 2)
INSERT INTO groups (id, name, cohort) VALUES
  (1, 'Group 1', 'Cohort 2'),
  (2, 'Group 2', 'Cohort 2'),
  (3, 'Group 3', 'Cohort 2'),
  (4, 'Group 4', 'Cohort 2'),
  (5, 'Group 5', 'Cohort 2'),
  (6, 'Group 6', 'Cohort 2')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to start from 7 for future groups
SELECT setval('groups_id_seq', 6);

-- Insert training days (10-day program)
INSERT INTO training_days (day_number, title, description, sop_series) VALUES
  (1, 'Ethics, Compliance, and Governance Framework', 'Legal ethics, confidentiality, UPL boundaries, incident protocols', ARRAY['F-1', 'F-2', 'F-3', 'F-4']),
  (2, 'Technology Stack I: Clio, Document Management, and the Pipeline', 'Clio operations, matter creation, document filing, task management', ARRAY['B-1', 'A-2', 'A-7']),
  (3, 'Technology Stack II: Claude AI, Prompt Engineering, and the PriorityLex Skill', 'AI-powered research, prompt optimization, legal analysis workflows', ARRAY['B-2', 'A-3']),
  (4, 'Technology Stack III: Quo Platform Administration and Operations', 'Quo operations, voice intake processing, dashboard management', ARRAY['B-4', 'A-1', 'A-5']),
  (5, 'Core Workflow: Full Pipeline Integration and Daily Operations', 'End-to-end workflow integration, daily operations, work execution', ARRAY['A-4', 'A-5', 'A-8']),
  (6, 'Legal Research, Citation Verification, and Quality Control', 'Legal research methodology, citation accuracy, quality assurance', ARRAY['B-5', 'A-8']),
  (7, 'Estate and Probate: Full Vertical Deep Dive', 'Estate-specific workflows, asset inventory, creditor management, case lifecycle', ARRAY['D-1', 'D-2', 'D-3', 'D-4']),
  (8, 'Client Interview Preparation', 'Client communication protocols, interview techniques, relationship management', ARRAY['A-6']),
  (9, 'Upsell Identification and Service Expansion', 'Service expansion opportunities, client needs assessment, practice growth', ARRAY[]::text[]),
  (10, 'Capstone Simulation and Final Certification Testing', 'Comprehensive competency testing, final certification assessment', ARRAY['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8', 'B-1', 'B-2', 'B-4', 'B-5', 'D-1', 'D-2', 'D-3', 'D-4', 'F-1', 'F-2', 'F-3', 'F-4'])
ON CONFLICT (day_number) DO NOTHING;

-- Insert chat channels (1 cohort + 6 groups + 1 announcement = 8 channels)
INSERT INTO chat_channels (name, type, group_id) VALUES
  ('Announcements', 'announcement', NULL),
  ('Cohort Chat', 'cohort', NULL),
  ('Group 1', 'group', 1),
  ('Group 2', 'group', 2),
  ('Group 3', 'group', 3),
  ('Group 4', 'group', 4),
  ('Group 5', 'group', 5),
  ('Group 6', 'group', 6)
ON CONFLICT DO NOTHING;

-- ===========================================
-- STEP 5: PROGRESS TRACKING SETUP
-- ===========================================

-- Function to create SOP competencies for a user
CREATE OR REPLACE FUNCTION create_sop_competencies_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- A Series: Core Operations
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'A-1', 'Voice Intake Processing'),
    (target_user_id, 'A-2', 'Matter Creation in Clio'),
    (target_user_id, 'A-3', 'AI-Powered Legal Research'),
    (target_user_id, 'A-4', 'Work Execution and Task Management'),
    (target_user_id, 'A-5', 'Daily Operations Dashboard'),
    (target_user_id, 'A-6', 'Client Communication Protocols'),
    (target_user_id, 'A-7', 'Document Management and Filing'),
    (target_user_id, 'A-8', 'Quality Control and Self-Review')
  ON CONFLICT (user_id, sop_code) DO NOTHING;

  -- B Series: Technology Operations
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'B-1', 'Clio Manage Operations'),
    (target_user_id, 'B-2', 'Claude AI Usage and Prompt Engineering'),
    (target_user_id, 'B-4', 'Quo Operations'),
    (target_user_id, 'B-5', 'Legal Research with Midpage MCP')
  ON CONFLICT (user_id, sop_code) DO NOTHING;

  -- D Series: Estate and Probate
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'D-1', 'Asset Inventory Compilation'),
    (target_user_id, 'D-2', 'Creditor Notification and Tracking'),
    (target_user_id, 'D-3', 'Estate Accounting Production'),
    (target_user_id, 'D-4', 'Estate Case Intake and Lifecycle Management')
  ON CONFLICT (user_id, sop_code) DO NOTHING;

  -- F Series: Governance and Compliance
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'F-1', 'Confidentiality and Data Handling'),
    (target_user_id, 'F-2', 'Ethical Boundaries and UPL Prevention'),
    (target_user_id, 'F-3', 'Attorney Review Submission Protocol'),
    (target_user_id, 'F-4', 'Incident Reporting and Escalation')
  ON CONFLICT (user_id, sop_code) DO NOTHING;
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
    (target_user_id, 'Midpage')
  ON CONFLICT (user_id, certification) DO NOTHING;

  -- Clio Credentials
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Clio Manage Product Essentials'),
    (target_user_id, 'Clio Certified Administrator'),
    (target_user_id, 'Clio Legal AI Fundamentals')
  ON CONFLICT (user_id, certification) DO NOTHING;

  -- Research Platforms
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Lexis AI'),
    (target_user_id, 'Spellbook'),
    (target_user_id, 'OpenBook')
  ON CONFLICT (user_id, certification) DO NOTHING;
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
DROP TRIGGER IF EXISTS create_star_player_progress_trigger ON users;
CREATE TRIGGER create_star_player_progress_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_star_player_progress();

-- ===========================================
-- STEP 6: STORAGE SETUP
-- ===========================================

-- Create storage buckets (ignore errors if they already exist)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES
    ('curriculum-materials', 'curriculum-materials', true),
    ('student-uploads', 'student-uploads', false);
EXCEPTION
  WHEN unique_violation THEN
    NULL; -- Ignore error if buckets already exist
END $$;

-- Drop existing storage policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM storage.policies) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

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
-- SETUP VERIFICATION
-- ===========================================

-- Verify setup
SELECT 'Database setup complete!' as message;
SELECT 'Tables created: ' || count(*) as result FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Groups seeded: ' || count(*) as result FROM groups;
SELECT 'Training days seeded: ' || count(*) as result FROM training_days;
SELECT 'Chat channels created: ' || count(*) as result FROM chat_channels;
SELECT 'Storage buckets: ' || count(*) as result FROM storage.buckets WHERE id IN ('curriculum-materials', 'student-uploads');