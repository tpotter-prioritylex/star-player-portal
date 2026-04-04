-- ===========================================
-- DATABASE FIXES FOR STAR PLAYER PORTAL
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. Create schedule_slots table (if missing)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id BIGSERIAL PRIMARY KEY,
  day_id INTEGER REFERENCES training_days(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  location TEXT,
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for schedule_slots
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day_id ON schedule_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_start_time ON schedule_slots(start_time);

-- Enable RLS on schedule_slots
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for schedule_slots
DROP TRIGGER IF EXISTS update_schedule_slots_updated_at ON schedule_slots;
CREATE TRIGGER update_schedule_slots_updated_at
  BEFORE UPDATE ON schedule_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Fix RLS policies for chat_channels (Admin access issue)
DROP POLICY IF EXISTS "Admin can read all chat channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can read cohort and group channels" ON chat_channels;

-- Admin can see all channels
CREATE POLICY "Admin can read all chat channels" ON chat_channels
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Instructors can see cohort + all group channels
CREATE POLICY "Instructor can read cohort and group channels" ON chat_channels
  FOR SELECT USING (get_user_role(auth.uid()) = 'instructor');

-- Star Players can see cohort + their own group channel
CREATE POLICY "Star Player can read cohort and own group channels" ON chat_channels
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'star_player' AND (
      type = 'cohort' OR
      type = 'announcement' OR
      group_id = (SELECT group_id FROM users WHERE id = auth.uid())
    )
  );

-- 3. Update training day titles in database
UPDATE training_days SET
  title = 'Ethics, Compliance, and Governance Framework',
  description = 'Legal ethics, confidentiality, UPL boundaries, incident protocols'
WHERE day_number = 1;

UPDATE training_days SET
  title = 'Technology Stack I: Clio, Document Management, and the Pipeline',
  description = 'Clio operations, matter creation, document filing, task management'
WHERE day_number = 2;

UPDATE training_days SET
  title = 'Technology Stack II: Claude AI, Prompt Engineering, and the PriorityLex Skill',
  description = 'AI-powered research, prompt optimization, legal analysis workflows'
WHERE day_number = 3;

UPDATE training_days SET
  title = 'Technology Stack III: Quo Platform Administration and Operations',
  description = 'Quo operations, voice intake processing, dashboard management'
WHERE day_number = 4;

UPDATE training_days SET
  title = 'Core Workflow: Full Pipeline Integration and Daily Operations',
  description = 'End-to-end workflow integration, daily operations, work execution'
WHERE day_number = 5;

UPDATE training_days SET
  title = 'Legal Research, Citation Verification, and Quality Control',
  description = 'Legal research methodology, citation accuracy, quality assurance'
WHERE day_number = 6;

UPDATE training_days SET
  title = 'Estate and Probate: Full Vertical Deep Dive',
  description = 'Estate-specific workflows, asset inventory, creditor management, case lifecycle'
WHERE day_number = 7;

UPDATE training_days SET
  title = 'Client Interview Preparation',
  description = 'Client communication protocols, interview techniques, relationship management'
WHERE day_number = 8;

UPDATE training_days SET
  title = 'Upsell Identification and Service Expansion',
  description = 'Service expansion opportunities, client needs assessment, practice growth'
WHERE day_number = 9;

UPDATE training_days SET
  title = 'Capstone Simulation and Final Certification Testing',
  description = 'Comprehensive competency testing, final certification assessment'
WHERE day_number = 10;

-- 4. Update SOP competencies with correct titles
-- Clean up old SOP competencies and recreate with correct codes/titles
DELETE FROM sop_competencies;

-- Function to create SOP competencies for existing users
CREATE OR REPLACE FUNCTION create_updated_sop_competencies_for_user(target_user_id UUID)
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

-- Create SOP competencies for all existing Star Players
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM users WHERE role = 'star_player'
  LOOP
    PERFORM create_updated_sop_competencies_for_user(user_record.id);
  END LOOP;
END $$;

-- 5. Update the training day SOP series mappings
UPDATE training_days SET sop_series = ARRAY['F-1', 'F-2', 'F-3', 'F-4'] WHERE day_number = 1;
UPDATE training_days SET sop_series = ARRAY['B-1', 'A-2', 'A-7'] WHERE day_number = 2;
UPDATE training_days SET sop_series = ARRAY['B-2', 'A-3'] WHERE day_number = 3;
UPDATE training_days SET sop_series = ARRAY['B-4', 'A-1', 'A-5'] WHERE day_number = 4;
UPDATE training_days SET sop_series = ARRAY['A-4', 'A-5', 'A-8'] WHERE day_number = 5;
UPDATE training_days SET sop_series = ARRAY['B-5', 'A-8'] WHERE day_number = 6;
UPDATE training_days SET sop_series = ARRAY['D-1', 'D-2', 'D-3', 'D-4'] WHERE day_number = 7;
UPDATE training_days SET sop_series = ARRAY['A-6'] WHERE day_number = 8;
UPDATE training_days SET sop_series = ARRAY[]::text[] WHERE day_number = 9;
UPDATE training_days SET sop_series = ARRAY['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8', 'B-1', 'B-2', 'B-4', 'B-5', 'D-1', 'D-2', 'D-3', 'D-4', 'F-1', 'F-2', 'F-3', 'F-4'] WHERE day_number = 10;

-- 6. Create sample schedule slots for Day 1
INSERT INTO schedule_slots (day_id, start_time, end_time, title, description) VALUES
  (1, '09:00', '09:30', 'Welcome & Introductions', 'Cohort introductions and program overview'),
  (1, '09:30', '11:00', 'Legal Ethics Foundation', 'Introduction to legal ethics and UPL boundaries'),
  (1, '11:15', '12:30', 'F-1: Confidentiality and Data Handling', 'Client confidentiality and data protection protocols'),
  (1, '13:30', '14:30', 'F-2: Ethical Boundaries and UPL Prevention', 'Understanding unauthorized practice of law boundaries'),
  (1, '14:45', '16:00', 'F-3: Attorney Review Submission Protocol', 'When and how to escalate work for attorney review'),
  (1, '16:00', '16:30', 'Day 1 Wrap-up', 'Q&A and assignment briefing')
ON CONFLICT DO NOTHING;

-- 7. Ensure all chat policies work for admin
CREATE POLICY "Admin can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can update chat messages" ON chat_messages
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete chat messages" ON chat_messages
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check schedule_slots table exists and has data
SELECT 'schedule_slots' as table_name, COUNT(*) as row_count FROM schedule_slots;

-- Check training days have correct titles
SELECT day_number, title FROM training_days ORDER BY day_number;

-- Check SOP competencies for star players
SELECT
  u.full_name,
  COUNT(sc.id) as sop_count
FROM users u
LEFT JOIN sop_competencies sc ON u.id = sc.user_id
WHERE u.role = 'star_player'
GROUP BY u.id, u.full_name
ORDER BY u.full_name;

-- Check chat channels are accessible
SELECT id, name, type FROM chat_channels ORDER BY type, id;

-- Check if we have the correct 20 SOPs
SELECT sop_code, sop_title FROM sop_competencies
WHERE user_id = (SELECT id FROM users WHERE role = 'star_player' LIMIT 1)
ORDER BY sop_code;

COMMIT;