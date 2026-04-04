-- PriorityLex Star Player Training Portal RLS Policies
-- Migration 002: Row Level Security

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
-- All authenticated users can read all users (needed for chat display names)
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete users
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- GROUPS TABLE POLICIES
-- All authenticated users can read groups
CREATE POLICY "Users can read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify groups
CREATE POLICY "Admins can insert groups" ON groups
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete groups" ON groups
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- TRAINING DAYS TABLE POLICIES
-- All authenticated users can read training days
CREATE POLICY "Users can read training days" ON training_days
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify training days
CREATE POLICY "Admins can modify training days" ON training_days
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- CURRICULUM MATERIALS TABLE POLICIES
-- All authenticated users can read curriculum materials (everyone can download)
CREATE POLICY "Users can read curriculum materials" ON curriculum_materials
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and instructor can insert/update/delete curriculum materials
CREATE POLICY "Admin and instructor can modify curriculum materials" ON curriculum_materials
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- STUDENT UPLOADS TABLE POLICIES
-- Star players can insert their own uploads (to their group only)
CREATE POLICY "Star players can insert own uploads" ON student_uploads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    get_user_role(auth.uid()) = 'star_player' AND
    group_id = get_user_group(auth.uid())
  );

-- Star players can read only their own uploads
CREATE POLICY "Star players can read own uploads" ON student_uploads
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'star_player' AND auth.uid() = user_id) OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

-- Admin and instructor can read all uploads
CREATE POLICY "Admin and instructor can read all uploads" ON student_uploads
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- Admin and instructor can update uploads (for review status)
CREATE POLICY "Admin and instructor can update uploads" ON student_uploads
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- Only admin can delete uploads
CREATE POLICY "Admin can delete uploads" ON student_uploads
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- CHAT CHANNELS TABLE POLICIES
-- Users can read channels they have access to
CREATE POLICY "Users can read accessible channels" ON chat_channels
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      type IN ('cohort', 'announcement') OR  -- Everyone can see cohort and announcement channels
      get_user_role(auth.uid()) IN ('admin', 'instructor') OR  -- Admins and instructors see all
      (type = 'group' AND group_id = get_user_group(auth.uid()))  -- Star players see their group
    )
  );

-- Only admins can modify channels
CREATE POLICY "Admin can modify channels" ON chat_channels
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- CHAT MESSAGES TABLE POLICIES
-- Users can read messages in channels they have access to
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

-- Users can insert messages to channels they have access to
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

-- Only admins can update messages (for soft delete)
CREATE POLICY "Admin can update messages" ON chat_messages
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- SOP COMPETENCIES TABLE POLICIES
-- Star players can read their own records
CREATE POLICY "Users can read own competencies" ON sop_competencies
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

-- Admin and instructor can insert/update all records
CREATE POLICY "Admin and instructor can modify competencies" ON sop_competencies
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- PIPELINE CERTIFICATIONS TABLE POLICIES
-- Same pattern as SOP competencies
CREATE POLICY "Users can read own certifications" ON pipeline_certifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can modify certifications" ON pipeline_certifications
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- ANNOUNCEMENTS TABLE POLICIES
-- All authenticated users can read announcements
CREATE POLICY "Users can read announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and instructor can insert announcements
CREATE POLICY "Admin and instructor can insert announcements" ON announcements
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'instructor'));

-- Only admin can update/delete announcements
CREATE POLICY "Admin can modify announcements" ON announcements
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete announcements" ON announcements
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');