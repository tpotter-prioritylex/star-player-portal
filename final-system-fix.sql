CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'star_player')),
  group_id INTEGER REFERENCES groups(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cohort TEXT NOT NULL DEFAULT 'Cohort 2',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_days (
  id SERIAL PRIMARY KEY,
  day_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  sop_series TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cohort', 'group', 'announcement')),
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id INTEGER REFERENCES chat_channels(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sop_competencies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  sop_code TEXT NOT NULL,
  sop_title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'demonstrated', 'verified')),
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sop_code)
);

CREATE TABLE IF NOT EXISTS pipeline_certifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  certification TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day_id ON schedule_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_materials_day_id ON curriculum_materials(day_id);
CREATE INDEX IF NOT EXISTS idx_student_uploads_user_id ON student_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_sop_competencies_user_id ON sop_competencies(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_group(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT group_id FROM users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "New users can create profile" ON users;

CREATE POLICY "Admin full access" ON users
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "New users can create profile" ON users
  FOR INSERT WITH CHECK (
    id = auth.uid() AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Everyone can read groups" ON groups;
CREATE POLICY "Everyone can read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage groups" ON groups;
CREATE POLICY "Admin can manage groups" ON groups
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Everyone can read training days" ON training_days;
CREATE POLICY "Everyone can read training days" ON training_days
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage training days" ON training_days;
CREATE POLICY "Admin can manage training days" ON training_days
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can read schedule slots" ON schedule_slots;
CREATE POLICY "Users can read schedule slots" ON schedule_slots
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage schedule slots" ON schedule_slots;
CREATE POLICY "Admin can manage schedule slots" ON schedule_slots
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can read curriculum materials" ON curriculum_materials;
CREATE POLICY "Users can read curriculum materials" ON curriculum_materials
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage curriculum materials" ON curriculum_materials;
CREATE POLICY "Admin can manage curriculum materials" ON curriculum_materials
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can read own uploads" ON student_uploads;
DROP POLICY IF EXISTS "Admin can read all uploads" ON student_uploads;
DROP POLICY IF EXISTS "Users can create uploads" ON student_uploads;
DROP POLICY IF EXISTS "Admin can manage uploads" ON student_uploads;

CREATE POLICY "Users can read own uploads" ON student_uploads
  FOR SELECT USING (
    user_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Users can create uploads" ON student_uploads
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    get_user_role(auth.uid()) = 'star_player'
  );

CREATE POLICY "Admin can manage uploads" ON student_uploads
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Instructors can update uploads" ON student_uploads
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin can read all channels" ON chat_channels;
DROP POLICY IF EXISTS "Instructor can read cohort and group channels" ON chat_channels;
DROP POLICY IF EXISTS "Star Player can read accessible channels" ON chat_channels;
DROP POLICY IF EXISTS "Admin can modify channels" ON chat_channels;

CREATE POLICY "Admin can read all channels" ON chat_channels
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Instructor can read channels" ON chat_channels
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'instructor' AND
    type IN ('cohort', 'announcement', 'group')
  );

CREATE POLICY "Star Player can read accessible channels" ON chat_channels
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'star_player' AND (
      type IN ('cohort', 'announcement') OR
      (type = 'group' AND group_id = get_user_group(auth.uid()))
    )
  );

CREATE POLICY "Admin can manage channels" ON chat_channels
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin can read all messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can read accessible messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages" ON chat_messages;

CREATE POLICY "Admin can read all messages" ON chat_messages
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read accessible messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        get_user_role(auth.uid()) = 'admin' OR
        (get_user_role(auth.uid()) = 'instructor' AND chat_channels.type IN ('cohort', 'announcement', 'group')) OR
        (get_user_role(auth.uid()) = 'star_player' AND (
          chat_channels.type IN ('cohort', 'announcement') OR
          (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
        ))
      )
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        get_user_role(auth.uid()) = 'admin' OR
        (get_user_role(auth.uid()) = 'instructor' AND chat_channels.type IN ('cohort', 'group')) OR
        (get_user_role(auth.uid()) = 'star_player' AND (
          chat_channels.type = 'cohort' OR
          (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
        ))
      )
    )
  );

CREATE POLICY "Users can delete messages" ON chat_messages
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'admin' OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can read own competencies" ON sop_competencies;
DROP POLICY IF EXISTS "Admin can manage competencies" ON sop_competencies;

CREATE POLICY "Users can read own competencies" ON sop_competencies
  FOR SELECT USING (
    user_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin can manage competencies" ON sop_competencies
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Instructors can update competencies" ON sop_competencies
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Users can read own certifications" ON pipeline_certifications;
DROP POLICY IF EXISTS "Admin can manage certifications" ON pipeline_certifications;

CREATE POLICY "Users can read own certifications" ON pipeline_certifications
  FOR SELECT USING (
    user_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin can manage certifications" ON pipeline_certifications
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Instructors can update certifications" ON pipeline_certifications
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Everyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;

CREATE POLICY "Everyone can read announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage announcements" ON announcements
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

INSERT INTO groups (id, name, cohort) VALUES
  (1, 'Group 1', 'Cohort 2'),
  (2, 'Group 2', 'Cohort 2'),
  (3, 'Group 3', 'Cohort 2'),
  (4, 'Group 4', 'Cohort 2'),
  (5, 'Group 5', 'Cohort 2'),
  (6, 'Group 6', 'Cohort 2')
ON CONFLICT (id) DO NOTHING;

SELECT setval('groups_id_seq', 6, true);

INSERT INTO training_days (day_number, title, description, sop_series) VALUES
  (1, 'Ethics, Compliance, and Governance Framework', 'Legal ethics, confidentiality, UPL boundaries, incident protocols', ARRAY['F-1', 'F-2', 'F-3', 'F-4']),
  (2, 'Technology Stack I -- Clio, Document Management, and the Pipeline', 'Clio operations, matter creation, document filing, task management', ARRAY['B-1', 'A-7', 'A-2']),
  (3, 'Technology Stack II -- Claude AI, Prompt Engineering, and the PriorityLex Skill', 'AI-powered research, prompt optimization, legal analysis workflows', ARRAY['B-2']),
  (4, 'Technology Stack III -- Quo Platform Administration and Operations', 'Quo operations, voice intake processing, dashboard management', ARRAY['B-4']),
  (5, 'Core Workflow -- Full Pipeline Integration and Daily Operations', 'End-to-end workflow integration, daily operations, work execution', ARRAY['A-1', 'A-6', 'A-4', 'A-5']),
  (6, 'Legal Research, Citation Verification, and Quality Control', 'Legal research methodology, citation accuracy, quality assurance', ARRAY['A-3', 'B-5', 'A-8']),
  (7, 'Estate and Probate -- Full Vertical Deep Dive', 'Estate-specific workflows, asset inventory, creditor management, case lifecycle', ARRAY['D-4', 'D-1', 'D-2', 'D-3']),
  (8, 'Client Interview Preparation', 'Client communication protocols, interview techniques, relationship management', ARRAY[]::text[]),
  (9, 'Upsell Identification and Service Expansion', 'Service expansion opportunities, client needs assessment, practice growth', ARRAY[]::text[]),
  (10, 'Capstone Simulation and Final Certification Testing', 'Comprehensive competency testing, final certification assessment', ARRAY['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8', 'B-1', 'B-2', 'B-4', 'B-5', 'D-1', 'D-2', 'D-3', 'D-4', 'F-1', 'F-2', 'F-3', 'F-4'])
ON CONFLICT (day_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sop_series = EXCLUDED.sop_series;

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

DELETE FROM sop_competencies;

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM users WHERE role = 'star_player'
  LOOP
    INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
      (user_record.id, 'A-1', 'Voice Intake Processing'),
      (user_record.id, 'A-2', 'Matter Creation in Clio'),
      (user_record.id, 'A-3', 'AI-Powered Legal Research'),
      (user_record.id, 'A-4', 'Work Execution and Task Management'),
      (user_record.id, 'A-5', 'Daily Operations Dashboard'),
      (user_record.id, 'A-6', 'Client Communication Protocols'),
      (user_record.id, 'A-7', 'Document Management and Filing'),
      (user_record.id, 'A-8', 'Quality Control and Self-Review'),
      (user_record.id, 'B-1', 'Clio Manage Operations'),
      (user_record.id, 'B-2', 'Claude AI Usage and Prompt Engineering'),
      (user_record.id, 'B-4', 'Quo Operations'),
      (user_record.id, 'B-5', 'Legal Research with Midpage MCP'),
      (user_record.id, 'D-1', 'Asset Inventory Compilation'),
      (user_record.id, 'D-2', 'Creditor Notification and Tracking'),
      (user_record.id, 'D-3', 'Estate Accounting Production'),
      (user_record.id, 'D-4', 'Estate Case Intake and Lifecycle Management'),
      (user_record.id, 'F-1', 'Confidentiality and Data Handling'),
      (user_record.id, 'F-2', 'Ethical Boundaries and UPL Prevention'),
      (user_record.id, 'F-3', 'Attorney Review Submission Protocol'),
      (user_record.id, 'F-4', 'Incident Reporting and Escalation')
    ON CONFLICT (user_id, sop_code) DO NOTHING;
  END LOOP;
END $$;

ALTER TABLE pipeline_certifications ADD CONSTRAINT unique_user_certification UNIQUE (user_id, certification);

INSERT INTO pipeline_certifications (user_id, certification)
SELECT u.id, cert.name
FROM users u
CROSS JOIN (
  VALUES
    ('Quo'),
    ('Clio'),
    ('Claude (with Legal Quality Standards)'),
    ('Midpage')
) AS cert(name)
WHERE u.role = 'star_player'
ON CONFLICT DO NOTHING;