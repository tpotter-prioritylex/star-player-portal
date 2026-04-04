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

CREATE INDEX IF NOT EXISTS idx_schedule_slots_day_id ON schedule_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_start_time ON schedule_slots(start_time);

ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_schedule_slots_updated_at ON schedule_slots;
CREATE TRIGGER update_schedule_slots_updated_at
  BEFORE UPDATE ON schedule_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "Users can read schedule slots" ON schedule_slots;
DROP POLICY IF EXISTS "Admins can modify schedule slots" ON schedule_slots;

CREATE POLICY "Users can read schedule slots" ON schedule_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify schedule slots" ON schedule_slots
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

UPDATE training_days SET
  title = 'Ethics, Compliance, and Governance Framework',
  description = 'Legal ethics, confidentiality, UPL boundaries, incident protocols',
  sop_series = ARRAY['F-1', 'F-2', 'F-3', 'F-4']
WHERE day_number = 1;

UPDATE training_days SET
  title = 'Technology Stack I -- Clio, Document Management, and the Pipeline',
  description = 'Clio operations, matter creation, document filing, task management',
  sop_series = ARRAY['B-1', 'A-7', 'A-2']
WHERE day_number = 2;

UPDATE training_days SET
  title = 'Technology Stack II -- Claude AI, Prompt Engineering, and the PriorityLex Skill',
  description = 'AI-powered research, prompt optimization, legal analysis workflows',
  sop_series = ARRAY['B-2']
WHERE day_number = 3;

UPDATE training_days SET
  title = 'Technology Stack III -- Quo Platform Administration and Operations',
  description = 'Quo operations, voice intake processing, dashboard management',
  sop_series = ARRAY['B-4']
WHERE day_number = 4;

UPDATE training_days SET
  title = 'Core Workflow -- Full Pipeline Integration and Daily Operations',
  description = 'End-to-end workflow integration, daily operations, work execution',
  sop_series = ARRAY['A-1', 'A-6', 'A-4', 'A-5']
WHERE day_number = 5;

UPDATE training_days SET
  title = 'Legal Research, Citation Verification, and Quality Control',
  description = 'Legal research methodology, citation accuracy, quality assurance',
  sop_series = ARRAY['A-3', 'B-5', 'A-8']
WHERE day_number = 6;

UPDATE training_days SET
  title = 'Estate and Probate -- Full Vertical Deep Dive',
  description = 'Estate-specific workflows, asset inventory, creditor management, case lifecycle',
  sop_series = ARRAY['D-4', 'D-1', 'D-2', 'D-3']
WHERE day_number = 7;

UPDATE training_days SET
  title = 'Client Interview Preparation',
  description = 'Client communication protocols, interview techniques, relationship management',
  sop_series = ARRAY[]::text[]
WHERE day_number = 8;

UPDATE training_days SET
  title = 'Upsell Identification and Service Expansion',
  description = 'Service expansion opportunities, client needs assessment, practice growth',
  sop_series = ARRAY[]::text[]
WHERE day_number = 9;

UPDATE training_days SET
  title = 'Capstone Simulation and Final Certification Testing',
  description = 'Comprehensive competency testing, final certification assessment',
  sop_series = ARRAY['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8', 'B-1', 'B-2', 'B-4', 'B-5', 'D-1', 'D-2', 'D-3', 'D-4', 'F-1', 'F-2', 'F-3', 'F-4']
WHERE day_number = 10;

DROP POLICY IF EXISTS "Users can read accessible channels" ON chat_channels;
DROP POLICY IF EXISTS "Admin can modify channels" ON chat_channels;
DROP POLICY IF EXISTS "Instructor can read cohort and group channels" ON chat_channels;
DROP POLICY IF EXISTS "Star Player can read cohort and own group channels" ON chat_channels;

CREATE POLICY "Admin can read all channels" ON chat_channels
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Instructor can read cohort and group channels" ON chat_channels
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

CREATE POLICY "Admin can modify channels" ON chat_channels
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can read accessible messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Admin can delete any message" ON chat_messages;

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

INSERT INTO schedule_slots (day_id, start_time, end_time, title, description, instructor)
SELECT
  td.id,
  '09:00'::TIME,
  '09:30'::TIME,
  'Welcome & Introductions',
  'Cohort introductions and program overview',
  'Program Director'
FROM training_days td
WHERE td.day_number = 1
AND NOT EXISTS (
  SELECT 1 FROM schedule_slots ss
  WHERE ss.day_id = td.id AND ss.title = 'Welcome & Introductions'
);

INSERT INTO schedule_slots (day_id, start_time, end_time, title, description, instructor)
SELECT
  td.id,
  '09:30'::TIME,
  '11:00'::TIME,
  'Legal Ethics Foundation',
  'Introduction to legal ethics and UPL boundaries',
  'Legal Instructor'
FROM training_days td
WHERE td.day_number = 1
AND NOT EXISTS (
  SELECT 1 FROM schedule_slots ss
  WHERE ss.day_id = td.id AND ss.title = 'Legal Ethics Foundation'
);

INSERT INTO schedule_slots (day_id, start_time, end_time, title, description, instructor)
SELECT
  td.id,
  '11:15'::TIME,
  '12:30'::TIME,
  'F-1: Confidentiality and Data Handling',
  'Client confidentiality and data protection protocols',
  'Compliance Officer'
FROM training_days td
WHERE td.day_number = 1
AND NOT EXISTS (
  SELECT 1 FROM schedule_slots ss
  WHERE ss.day_id = td.id AND ss.title = 'F-1: Confidentiality and Data Handling'
);

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
      (user_record.id, 'A-8', 'Quality Control and Self-Review')
    ON CONFLICT (user_id, sop_code) DO NOTHING;

    INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
      (user_record.id, 'B-1', 'Clio Manage Operations'),
      (user_record.id, 'B-2', 'Claude AI Usage and Prompt Engineering'),
      (user_record.id, 'B-4', 'Quo Operations'),
      (user_record.id, 'B-5', 'Legal Research with Midpage MCP')
    ON CONFLICT (user_id, sop_code) DO NOTHING;

    INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
      (user_record.id, 'D-1', 'Asset Inventory Compilation'),
      (user_record.id, 'D-2', 'Creditor Notification and Tracking'),
      (user_record.id, 'D-3', 'Estate Accounting Production'),
      (user_record.id, 'D-4', 'Estate Case Intake and Lifecycle Management')
    ON CONFLICT (user_id, sop_code) DO NOTHING;

    INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
      (user_record.id, 'F-1', 'Confidentiality and Data Handling'),
      (user_record.id, 'F-2', 'Ethical Boundaries and UPL Prevention'),
      (user_record.id, 'F-3', 'Attorney Review Submission Protocol'),
      (user_record.id, 'F-4', 'Incident Reporting and Escalation')
    ON CONFLICT (user_id, sop_code) DO NOTHING;
  END LOOP;
END $$;