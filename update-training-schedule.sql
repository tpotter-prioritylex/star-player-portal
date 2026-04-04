-- UPDATE TRAINING SCHEDULE: Change from 10 days to 9 days
-- This updates the training schedule with optimized 9-day program

-- Clear existing schedule
DELETE FROM training_days;

-- Insert 9-day schedule with SOP mappings
INSERT INTO training_days (day_number, title, description, sop_series) VALUES
(1, 'Foundation Day', 'Core systems training and initial setup',
 ARRAY['A-1', 'A-2', 'A-5', 'B-1', 'F-1', 'F-2']),

(2, 'AI & Research Mastery', 'Advanced AI usage and legal research techniques',
 ARRAY['A-3', 'B-2', 'B-5', 'F-3']),

(3, 'Workflow Excellence', 'Task management and quality control processes',
 ARRAY['A-4', 'A-6', 'A-8', 'F-4']),

(4, 'Document & Communication Systems', 'Professional documentation and client communication',
 ARRAY['A-6', 'A-7', 'B-4']),

(5, 'Estate & Probate Foundations', 'Core estate administration processes',
 ARRAY['D-1', 'D-2']),

(6, 'Estate Accounting & Management', 'Financial tracking and case lifecycle',
 ARRAY['D-3', 'D-4']),

(7, 'Advanced Technology Integration', 'Complex system operations and integrations',
 ARRAY['B-1', 'B-2', 'B-4', 'B-5']),

(8, 'Compliance & Ethics Mastery', 'Governance, boundaries, and ethical practices',
 ARRAY['F-1', 'F-2', 'F-3', 'F-4']),

(9, 'Integration & Excellence', 'Comprehensive workflow integration and advanced practices',
 ARRAY['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8']);

-- Note: No target_completion_day column exists in sop_competencies table
-- SOP completion is tracked by status field instead

-- Success message
SELECT 'Training schedule updated to 9 days successfully.' as status;