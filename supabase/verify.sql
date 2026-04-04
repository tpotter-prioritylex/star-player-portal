-- Verification Script for PriorityLex Star Player Training Portal Database
-- Run this to check that setup completed successfully

-- Check all tables exist
SELECT
  'Tables Status' as check_type,
  CASE
    WHEN COUNT(*) = 10 THEN 'PASS - All 10 tables created'
    ELSE 'FAIL - Expected 10 tables, found ' || COUNT(*)
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'groups', 'training_days', 'curriculum_materials',
    'student_uploads', 'chat_channels', 'chat_messages',
    'sop_competencies', 'pipeline_certifications', 'announcements'
  );

-- Check groups were seeded
SELECT
  'Groups Seeded' as check_type,
  CASE
    WHEN COUNT(*) = 6 THEN 'PASS - All 6 groups created'
    ELSE 'FAIL - Expected 6 groups, found ' || COUNT(*)
  END as status
FROM groups;

-- Check training days were seeded
SELECT
  'Training Days' as check_type,
  CASE
    WHEN COUNT(*) = 10 THEN 'PASS - All 10 training days created'
    ELSE 'FAIL - Expected 10 training days, found ' || COUNT(*)
  END as status
FROM training_days;

-- Check chat channels were created
SELECT
  'Chat Channels' as check_type,
  CASE
    WHEN COUNT(*) = 8 THEN 'PASS - All 8 chat channels created'
    ELSE 'FAIL - Expected 8 chat channels, found ' || COUNT(*)
  END as status
FROM chat_channels;

-- Check RLS is enabled on all tables
SELECT
  'RLS Enabled' as check_type,
  CASE
    WHEN COUNT(*) = 10 THEN 'PASS - RLS enabled on all tables'
    ELSE 'FAIL - RLS not enabled on all tables'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname IN (
    'users', 'groups', 'training_days', 'curriculum_materials',
    'student_uploads', 'chat_channels', 'chat_messages',
    'sop_competencies', 'pipeline_certifications', 'announcements'
  );

-- Check helper functions exist
SELECT
  'Helper Functions' as check_type,
  CASE
    WHEN COUNT(*) >= 2 THEN 'PASS - Helper functions created'
    ELSE 'FAIL - Missing helper functions'
  END as status
FROM pg_proc
WHERE proname IN ('get_user_role', 'get_user_group');

-- Check storage buckets exist
SELECT
  'Storage Buckets' as check_type,
  CASE
    WHEN COUNT(*) = 2 THEN 'PASS - Both storage buckets created'
    ELSE 'FAIL - Expected 2 storage buckets, found ' || COUNT(*)
  END as status
FROM storage.buckets
WHERE id IN ('curriculum-materials', 'student-uploads');

-- Check triggers exist
SELECT
  'Triggers' as check_type,
  CASE
    WHEN COUNT(*) >= 3 THEN 'PASS - Triggers created'
    ELSE 'FAIL - Missing triggers'
  END as status
FROM pg_trigger
WHERE tgname IN ('update_users_updated_at', 'update_sop_competencies_updated_at', 'create_star_player_progress_trigger');

-- Summary of table record counts
SELECT 'RECORD COUNTS' as summary, NULL as count
UNION ALL
SELECT 'Users', COUNT(*)::text FROM users
UNION ALL
SELECT 'Groups', COUNT(*)::text FROM groups
UNION ALL
SELECT 'Training Days', COUNT(*)::text FROM training_days
UNION ALL
SELECT 'Curriculum Materials', COUNT(*)::text FROM curriculum_materials
UNION ALL
SELECT 'Student Uploads', COUNT(*)::text FROM student_uploads
UNION ALL
SELECT 'Chat Channels', COUNT(*)::text FROM chat_channels
UNION ALL
SELECT 'Chat Messages', COUNT(*)::text FROM chat_messages
UNION ALL
SELECT 'SOP Competencies', COUNT(*)::text FROM sop_competencies
UNION ALL
SELECT 'Pipeline Certifications', COUNT(*)::text FROM pipeline_certifications
UNION ALL
SELECT 'Announcements', COUNT(*)::text FROM announcements;

-- List all RLS policies created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;