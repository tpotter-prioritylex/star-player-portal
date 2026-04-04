-- PriorityLex Star Player Training Portal Complete Setup
-- Run this script in your Supabase SQL editor to set up the entire database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\i 001_schema.sql
\i 002_rls.sql
\i 003_seed.sql
\i 004_storage.sql

-- Note: After running this setup, you'll need to:
-- 1. Create an admin user through the Supabase Auth interface or admin API
-- 2. Insert the admin user record into the users table manually:
--
-- Example (replace with actual admin user ID from auth.users):
-- INSERT INTO users (id, email, full_name, role, group_id) VALUES
--   ('your-admin-user-id-from-auth-users', 'admin@prioritylex.com', 'Thomas Potter', 'admin', NULL);
--
-- 3. Optionally create test instructor and star player accounts
-- 4. Test the application functionality

-- Sample data for testing (uncomment if needed)
/*
-- Sample curriculum material (after creating admin user)
INSERT INTO curriculum_materials (title, description, file_url, file_name, file_size, day_id, sop_reference, practice_area, uploaded_by) VALUES
  ('Introduction to Quo Intake', 'Getting started with the Quo platform for client intake', 'day-1/quo-intro.pdf', 'quo-intro.pdf', 1024000, 1, 'A-1', 'General Practice', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- Sample announcement
INSERT INTO announcements (title, content, author_id, pinned) VALUES
  ('Training Starts Monday', 'All Star Players should join their group chats and review Day 1 materials over the weekend. Training begins Monday at 9 AM EST.', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true);
*/