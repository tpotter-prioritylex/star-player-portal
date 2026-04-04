-- CLEAN TEST DATA: Remove all test data except admin account
-- CRITICAL: Only run this ONCE in production to clean test data
-- This preserves the admin account and resets everything else to a clean state

-- Clean chat messages (keep structure)
DELETE FROM chat_messages WHERE id != '00000000-0000-0000-0000-000000000000';

-- Clean student uploads
DELETE FROM student_uploads WHERE user_id != (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Clean SOP competencies for non-admin users
DELETE FROM sop_competencies WHERE user_id != (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Clean pipeline certifications
DELETE FROM pipeline_certifications WHERE user_id != (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Clean announcements except system announcements
DELETE FROM announcements WHERE author_id != (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Clean non-admin users (keep one admin)
DELETE FROM users WHERE role != 'admin' OR id != (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Reset chat channels to default state
DELETE FROM chat_channels WHERE id NOT IN (1, 2, 3, 4, 5, 6, 7);
INSERT INTO chat_channels (id, name, type, group_id) VALUES
(1, 'Cohort Chat', 'cohort', NULL),
(2, 'Group 1', 'group', 1),
(3, 'Group 2', 'group', 2),
(4, 'Group 3', 'group', 3),
(5, 'Group 4', 'group', 4),
(6, 'Group 5', 'group', 5),
(7, 'Group 6', 'group', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Reset groups to clean state
DELETE FROM groups WHERE id NOT IN (1, 2, 3, 4, 5, 6);
INSERT INTO groups (id, name) VALUES
(1, 'Group 1'),
(2, 'Group 2'),
(3, 'Group 3'),
(4, 'Group 4'),
(5, 'Group 5'),
(6, 'Group 6')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Success message
SELECT 'Production data cleaned. Only admin account and basic structure remains.' as status;