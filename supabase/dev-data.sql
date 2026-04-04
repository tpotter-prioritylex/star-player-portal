-- Development Test Data for PriorityLex Star Player Training Portal
-- Run this ONLY in development after completing the main setup
-- This creates sample users and data for testing

-- Note: You must first create auth users through Supabase Auth Admin API
-- Then replace the UUIDs below with the actual user IDs from auth.users

-- Sample Admin User (replace UUID with actual auth user ID)
INSERT INTO users (id, email, full_name, role, group_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@prioritylex.com', 'Thomas Potter', 'admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Sample Instructor (replace UUID with actual auth user ID)
INSERT INTO users (id, email, full_name, role, group_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'instructor@prioritylex.com', 'Sarah Wilson', 'instructor', NULL)
ON CONFLICT (id) DO NOTHING;

-- Sample Star Players (replace UUIDs with actual auth user IDs)
INSERT INTO users (id, email, full_name, role, group_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'student1@example.com', 'Alex Johnson', 'star_player', 1),
  ('00000000-0000-0000-0000-000000000004', 'student2@example.com', 'Maria Garcia', 'star_player', 1),
  ('00000000-0000-0000-0000-000000000005', 'student3@example.com', 'David Chen', 'star_player', 2),
  ('00000000-0000-0000-0000-000000000006', 'student4@example.com', 'Emily Rodriguez', 'star_player', 2)
ON CONFLICT (id) DO NOTHING;

-- Sample curriculum materials
INSERT INTO curriculum_materials (title, description, file_url, file_name, file_size, day_id, sop_reference, practice_area, uploaded_by) VALUES
  ('Quo Intake Platform Overview', 'Introduction to the Quo platform and basic navigation', 'day-1/quo-overview.pdf', 'quo-overview.pdf', 2048000, 1, 'A-1', 'General Practice', '00000000-0000-0000-0000-000000000001'),
  ('Client Intake Best Practices', 'Guidelines for conducting effective client intake interviews', 'day-1/intake-best-practices.pdf', 'intake-best-practices.pdf', 1536000, 1, 'A-1', 'General Practice', '00000000-0000-0000-0000-000000000002'),
  ('Clio Matter Management', 'Creating and organizing matters in Clio', 'day-2/clio-matter-setup.pdf', 'clio-matter-setup.pdf', 3072000, 2, 'B-1', 'Practice Management', '00000000-0000-0000-0000-000000000001');

-- Sample student uploads
INSERT INTO student_uploads (user_id, group_id, day_id, title, description, file_url, file_name, file_size, status, reviewer_id, reviewer_notes) VALUES
  ('00000000-0000-0000-0000-000000000003', 1, 1, 'Quo Intake Practice Exercise', 'Completed intake form using Quo platform', 'group-1/day-1/00000000-0000-0000-0000-000000000003/intake-exercise.pdf', 'intake-exercise.pdf', 512000, 'reviewed', '00000000-0000-0000-0000-000000000002', 'Good work! Consider adding more detail in the notes section.'),
  ('00000000-0000-0000-0000-000000000004', 1, 1, 'Client Interview Simulation', 'Role-play exercise with mock client', 'group-1/day-1/00000000-0000-0000-0000-000000000004/client-interview.pdf', 'client-interview.pdf', 768000, 'submitted', NULL, NULL),
  ('00000000-0000-0000-0000-000000000005', 2, 1, 'Intake Process Documentation', 'Documentation of intake workflow steps', 'group-2/day-1/00000000-0000-0000-0000-000000000005/workflow-doc.pdf', 'workflow-doc.pdf', 1024000, 'approved', '00000000-0000-0000-0000-000000000001', 'Excellent documentation! Very thorough.');

-- Sample chat messages
INSERT INTO chat_messages (channel_id, user_id, content) VALUES
  (2, '00000000-0000-0000-0000-000000000002', 'Welcome everyone to Cohort 2! I''m excited to work with you all over the next 10 days.'),
  (2, '00000000-0000-0000-0000-000000000003', 'Thank you! Looking forward to learning the PriorityLex workflow.'),
  (3, '00000000-0000-0000-0000-000000000003', 'Hey Group 1! Should we set up a study session for tomorrow?'),
  (3, '00000000-0000-0000-0000-000000000004', 'That sounds great! I could use help with the Quo platform.');

-- Update some SOP competencies to show progress
UPDATE sop_competencies SET
  status = 'demonstrated',
  updated_by = '00000000-0000-0000-0000-000000000002',
  notes = 'Completed during Day 1 exercises',
  updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000003' AND sop_code IN ('A-1', 'A-2');

UPDATE sop_competencies SET
  status = 'in_progress',
  updated_by = '00000000-0000-0000-0000-000000000002',
  notes = 'Working on practice exercises',
  updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000003' AND sop_code = 'A-3';

-- Update some pipeline certifications
UPDATE pipeline_certifications SET
  status = 'in_progress',
  updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000003' AND certification IN ('Quo', 'Clio');

UPDATE pipeline_certifications SET
  status = 'completed',
  completed_at = now(),
  verified_by = '00000000-0000-0000-0000-000000000002',
  updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000003' AND certification = 'Quo';

-- Add a pinned announcement
INSERT INTO announcements (title, content, author_id, pinned) VALUES
  ('Week 1 Schedule Update', 'Please note that Day 3 will start 30 minutes later (9:30 AM EST) due to a special guest speaker session. All materials are available in the library.', '00000000-0000-0000-0000-000000000001', true);

-- Verify the test data
SELECT 'Users created:' as info, count(*) as count FROM users
UNION ALL
SELECT 'Curriculum materials:', count(*) FROM curriculum_materials
UNION ALL
SELECT 'Student uploads:', count(*) FROM student_uploads
UNION ALL
SELECT 'Chat messages:', count(*) FROM chat_messages
UNION ALL
SELECT 'SOP competencies:', count(*) FROM sop_competencies
UNION ALL
SELECT 'Pipeline certifications:', count(*) FROM pipeline_certifications;