-- Fix All Critical Issues - April 4, 2026
-- This script fixes chat channels, removes unwanted certifications, and updates RLS policies

-- 1. FIX CHAT: Remove announcement channel from chat_channels (announcements are separate page)
DELETE FROM chat_channels WHERE type = 'announcement';

-- 2. UPDATE RLS POLICY: Remove announcement type from chat channels policy
DROP POLICY IF EXISTS "Users can read accessible channels" ON chat_channels;
CREATE POLICY "Users can read accessible channels" ON chat_channels
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      type = 'cohort' OR  -- Everyone can see cohort channel
      get_user_role(auth.uid()) IN ('admin', 'instructor') OR  -- Admins and instructors see all
      (type = 'group' AND group_id = get_user_group(auth.uid()))  -- Star players see their group
    )
  );

-- 3. UPDATE RLS POLICY: Remove announcement type from chat messages policy
DROP POLICY IF EXISTS "Users can read accessible messages" ON chat_messages;
CREATE POLICY "Users can read accessible messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        chat_channels.type = 'cohort' OR
        get_user_role(auth.uid()) IN ('admin', 'instructor') OR
        (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to accessible channels" ON chat_messages;
CREATE POLICY "Users can insert messages to accessible channels" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        chat_channels.type = 'cohort' OR
        get_user_role(auth.uid()) IN ('admin', 'instructor') OR
        (chat_channels.type = 'group' AND chat_channels.group_id = get_user_group(auth.uid()))
      )
    )
  );

-- 4. REMOVE UNWANTED PIPELINE CERTIFICATIONS: Keep only Quo, Clio, Claude, Midpage
DELETE FROM pipeline_certifications
WHERE certification IN ('Lexis AI', 'Spellbook', 'OpenBook');

-- 5. UPDATE THE SEED FUNCTION: Remove unwanted certifications from new user creation
CREATE OR REPLACE FUNCTION create_pipeline_certifications_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Core Pipeline Tools ONLY
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Quo'),
    (target_user_id, 'Clio'),
    (target_user_id, 'Claude (with Legal Quality Standards)'),
    (target_user_id, 'Midpage');

  -- Clio Credentials (keep these)
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Clio Manage Product Essentials'),
    (target_user_id, 'Clio Certified Administrator'),
    (target_user_id, 'Clio Legal AI Fundamentals');
END;
$$ LANGUAGE plpgsql;

-- 6. VERIFY CHAT CHANNELS EXIST
INSERT INTO chat_channels (name, type, group_id) VALUES
  ('Cohort Chat', 'cohort', NULL),
  ('Group 1', 'group', 1),
  ('Group 2', 'group', 2),
  ('Group 3', 'group', 3),
  ('Group 4', 'group', 4),
  ('Group 5', 'group', 5),
  ('Group 6', 'group', 6)
ON CONFLICT DO NOTHING;

-- 7. Add debug function to check user permissions
CREATE OR REPLACE FUNCTION debug_user_permissions(check_user_id UUID)
RETURNS TABLE(
  user_email TEXT,
  user_role TEXT,
  user_group INTEGER,
  accessible_channels TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email,
    u.role,
    u.group_id,
    ARRAY(
      SELECT cc.name
      FROM chat_channels cc
      WHERE (
        cc.type = 'cohort' OR
        u.role IN ('admin', 'instructor') OR
        (cc.type = 'group' AND cc.group_id = u.group_id)
      )
      ORDER BY cc.id
    ) as accessible_channels
  FROM users u
  WHERE u.id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;