-- CRITICAL PRODUCTION FIX - April 4, 2026
-- Complete RLS policy rewrite to fix timeouts and infinite spinners

-- DROP ALL EXISTING RLS POLICIES ON ALL TABLES
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can read groups" ON groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Users can read training days" ON training_days;
DROP POLICY IF EXISTS "Admins can modify training days" ON training_days;
DROP POLICY IF EXISTS "Users can read curriculum materials" ON curriculum_materials;
DROP POLICY IF EXISTS "Admin and instructor can modify curriculum materials" ON curriculum_materials;
DROP POLICY IF EXISTS "Star players can insert own uploads" ON student_uploads;
DROP POLICY IF EXISTS "Star players can read own uploads" ON student_uploads;
DROP POLICY IF EXISTS "Admin and instructor can read all uploads" ON student_uploads;
DROP POLICY IF EXISTS "Admin and instructor can update uploads" ON student_uploads;
DROP POLICY IF EXISTS "Admin can delete uploads" ON student_uploads;
DROP POLICY IF EXISTS "Users can read accessible channels" ON chat_channels;
DROP POLICY IF EXISTS "Admin can modify channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can read accessible messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to accessible channels" ON chat_messages;
DROP POLICY IF EXISTS "Admin can update messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can read own competencies" ON sop_competencies;
DROP POLICY IF EXISTS "Admin and instructor can modify competencies" ON sop_competencies;
DROP POLICY IF EXISTS "Users can read own certifications" ON pipeline_certifications;
DROP POLICY IF EXISTS "Admin and instructor can modify certifications" ON pipeline_certifications;
DROP POLICY IF EXISTS "Users can read announcements" ON announcements;
DROP POLICY IF EXISTS "Admin and instructor can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can modify announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
DROP POLICY IF EXISTS "authenticated_read" ON groups;
DROP POLICY IF EXISTS "authenticated_read" ON training_days;
DROP POLICY IF EXISTS "authenticated_read" ON curriculum_materials;
DROP POLICY IF EXISTS "authenticated_read" ON announcements;
DROP POLICY IF EXISTS "authenticated_read" ON chat_channels;
DROP POLICY IF EXISTS "admin_write" ON groups;
DROP POLICY IF EXISTS "admin_write" ON training_days;
DROP POLICY IF EXISTS "admin_write" ON curriculum_materials;
DROP POLICY IF EXISTS "admin_write" ON announcements;
DROP POLICY IF EXISTS "admin_write" ON chat_channels;

-- CLEAN UP DUPLICATE CHAT CHANNELS
DELETE FROM chat_channels WHERE id NOT IN (
  SELECT MIN(id) FROM chat_channels GROUP BY name, type, group_id
);

-- REMOVE ORPHANED PIPELINE CERTIFICATIONS
DELETE FROM pipeline_certifications WHERE certification IN ('Lexis AI', 'Spellbook', 'OpenBook');

-- ADD UNIQUE CONSTRAINT ON CHAT CHANNELS
ALTER TABLE chat_channels DROP CONSTRAINT IF EXISTS unique_channel_name_type;
ALTER TABLE chat_channels ADD CONSTRAINT unique_channel_name_type UNIQUE (name, type, group_id);

-- ENSURE CHAT CHANNELS EXIST (NO ANNOUNCEMENTS IN CHAT)
INSERT INTO chat_channels (name, type, group_id) VALUES
  ('Cohort Chat', 'cohort', NULL),
  ('Group 1', 'group', 1),
  ('Group 2', 'group', 2),
  ('Group 3', 'group', 3),
  ('Group 4', 'group', 4),
  ('Group 5', 'group', 5),
  ('Group 6', 'group', 6)
ON CONFLICT (name, type, group_id) DO NOTHING;

-- CREATE SIMPLIFIED RLS POLICIES

-- USERS TABLE
CREATE POLICY "authenticated_read_users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_users" ON users
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- GROUPS TABLE - all authenticated users can read
CREATE POLICY "authenticated_read_groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_write_groups" ON groups
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- TRAINING_DAYS TABLE - all authenticated users can read
CREATE POLICY "authenticated_read_training_days" ON training_days
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_write_training_days" ON training_days
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- CURRICULUM_MATERIALS TABLE - all authenticated users can read
CREATE POLICY "authenticated_read_materials" ON curriculum_materials
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_instructor_write_materials" ON curriculum_materials
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor')));

-- STUDENT_UPLOADS TABLE
CREATE POLICY "read_uploads" ON student_uploads
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor'))
    OR user_id = auth.uid()
  );

CREATE POLICY "create_uploads" ON student_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_instructor_manage_uploads" ON student_uploads
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor')));

CREATE POLICY "admin_delete_uploads" ON student_uploads
  FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- CHAT_CHANNELS TABLE - simplified channel access
CREATE POLICY "read_chat_channels" ON chat_channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_channels" ON chat_channels
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- CHAT_MESSAGES TABLE - simplified message access
CREATE POLICY "read_messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "send_messages" ON chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_messages" ON chat_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- SOP_COMPETENCIES TABLE
CREATE POLICY "read_competencies" ON sop_competencies
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor'))
    OR user_id = auth.uid()
  );

CREATE POLICY "admin_instructor_manage_competencies" ON sop_competencies
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor')));

-- PIPELINE_CERTIFICATIONS TABLE
CREATE POLICY "read_certifications" ON pipeline_certifications
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor'))
    OR user_id = auth.uid()
  );

CREATE POLICY "admin_instructor_manage_certifications" ON pipeline_certifications
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor')));

-- ANNOUNCEMENTS TABLE - all authenticated users can read
CREATE POLICY "authenticated_read_announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_instructor_write_announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'instructor')));

CREATE POLICY "admin_manage_announcements" ON announcements
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- SCHEDULE_SLOTS TABLE (if it exists) - all authenticated users can read
CREATE POLICY "authenticated_read_schedule" ON schedule_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_write_schedule" ON schedule_slots
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- UPDATE SEED FUNCTION TO REMOVE UNWANTED CERTIFICATIONS
CREATE OR REPLACE FUNCTION create_pipeline_certifications_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Quo'),
    (target_user_id, 'Clio'),
    (target_user_id, 'Claude (with Legal Quality Standards)'),
    (target_user_id, 'Midpage'),
    (target_user_id, 'Clio Manage Product Essentials'),
    (target_user_id, 'Clio Certified Administrator'),
    (target_user_id, 'Clio Legal AI Fundamentals');
END;
$$ LANGUAGE plpgsql;