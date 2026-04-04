-- PriorityLex Star Player Training Portal Seed Data
-- Migration 003: Initial Data

-- Insert default groups (6 groups for Cohort 2)
INSERT INTO groups (id, name, cohort) VALUES
  (1, 'Group 1', 'Cohort 2'),
  (2, 'Group 2', 'Cohort 2'),
  (3, 'Group 3', 'Cohort 2'),
  (4, 'Group 4', 'Cohort 2'),
  (5, 'Group 5', 'Cohort 2'),
  (6, 'Group 6', 'Cohort 2');

-- Reset sequence to start from 7 for future groups
SELECT setval('groups_id_seq', 6);

-- Insert training days (10-day program)
INSERT INTO training_days (day_number, title, description, sop_series) VALUES
  (1, 'Quo Intake Mastery', 'Intake platform, answering trees, client communication', ARRAY['A-1', 'A-2', 'A-3']),
  (2, 'Clio Foundations', 'Matter creation, contacts, relationships', ARRAY['B-1', 'B-2']),
  (3, 'Clio Advanced', 'Tasks, calendars, document management', ARRAY['B-3', 'B-4']),
  (4, 'Claude Legal Drafting I', 'Research memos, client letters', ARRAY['C-1', 'C-2']),
  (5, 'Claude Legal Drafting II', 'Motions, contract review', ARRAY['C-3', 'C-4']),
  (6, 'Claude Legal Drafting III', 'Case summaries, quality standards', ARRAY['C-5']),
  (7, 'Midpage Research', 'Case law, statutory, verification', ARRAY['D-1', 'D-2', 'D-3']),
  (8, 'Pipeline Integration', 'End-to-end workflow across all tools', ARRAY['E-1', 'E-2', 'E-3']),
  (9, 'Quality and Review', 'Self-review, peer review protocols', ARRAY['F-1', 'F-2']),
  (10, 'Capstone and Certification', 'Integrated exercise, competency verification', ARRAY['A-1', 'A-2', 'A-3', 'B-1', 'B-2', 'B-3', 'B-4', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'D-1', 'D-2', 'D-3', 'E-1', 'E-2', 'E-3', 'F-1', 'F-2']);

-- Insert chat channels (1 cohort + 6 groups + 1 announcement = 8 channels)
INSERT INTO chat_channels (name, type, group_id) VALUES
  ('Announcements', 'announcement', NULL),
  ('Cohort Chat', 'cohort', NULL),
  ('Group 1', 'group', 1),
  ('Group 2', 'group', 2),
  ('Group 3', 'group', 3),
  ('Group 4', 'group', 4),
  ('Group 5', 'group', 5),
  ('Group 6', 'group', 6);

-- Function to create SOP competencies for a user
CREATE OR REPLACE FUNCTION create_sop_competencies_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- A Series: Quo Intake
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'A-1', 'New Client Intake'),
    (target_user_id, 'A-2', 'Returning Client Intake'),
    (target_user_id, 'A-3', 'Intake Quality Review');

  -- B Series: Clio Matter Setup
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'B-1', 'Matter Creation'),
    (target_user_id, 'B-2', 'Contact and Relationship Linking'),
    (target_user_id, 'B-3', 'Task and Calendar Setup'),
    (target_user_id, 'B-4', 'Document Organization');

  -- C Series: Claude Legal Drafting
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'C-1', 'Research Memorandum'),
    (target_user_id, 'C-2', 'Client Letter Drafting'),
    (target_user_id, 'C-3', 'Motion Drafting'),
    (target_user_id, 'C-4', 'Contract Review and Redline'),
    (target_user_id, 'C-5', 'Case Summary');

  -- D Series: Midpage Legal Research
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'D-1', 'Case Law Research'),
    (target_user_id, 'D-2', 'Statutory Research'),
    (target_user_id, 'D-3', 'Authority Verification');

  -- E Series: Pipeline Integration
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'E-1', 'Quo to Clio Handoff'),
    (target_user_id, 'E-2', 'Clio to Claude Workflow'),
    (target_user_id, 'E-3', 'Claude to Midpage Verification');

  -- F Series: Quality and Review
  INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
    (target_user_id, 'F-1', 'Self-Review Protocol'),
    (target_user_id, 'F-2', 'Peer Review Protocol');
END;
$$ LANGUAGE plpgsql;

-- Function to create pipeline certifications for a user
CREATE OR REPLACE FUNCTION create_pipeline_certifications_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Core Pipeline Tools
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Quo'),
    (target_user_id, 'Clio'),
    (target_user_id, 'Claude (with Legal Quality Standards)'),
    (target_user_id, 'Midpage');

  -- Clio Credentials
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Clio Manage Product Essentials'),
    (target_user_id, 'Clio Certified Administrator'),
    (target_user_id, 'Clio Legal AI Fundamentals');

  -- Research Platforms
  INSERT INTO pipeline_certifications (user_id, certification) VALUES
    (target_user_id, 'Lexis AI'),
    (target_user_id, 'Spellbook'),
    (target_user_id, 'OpenBook');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create competencies and certifications for new Star Players
CREATE OR REPLACE FUNCTION create_star_player_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create for Star Players
  IF NEW.role = 'star_player' THEN
    PERFORM create_sop_competencies_for_user(NEW.id);
    PERFORM create_pipeline_certifications_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER create_star_player_progress_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_star_player_progress();

-- Insert a sample announcement
INSERT INTO announcements (title, content, author_id) VALUES
  ('Welcome to Cohort 2!', 'Welcome to the PriorityLex Star Player Training Academy! Over the next 10 days, you''ll master the essential tools and workflows that power modern legal practice. Check your group assignments and get ready to excel.',
   (SELECT id FROM auth.users WHERE email = 'admin@prioritylex.com' LIMIT 1));

-- Note: The admin user will need to be created separately since it requires auth.users setup