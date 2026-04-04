-- FIX DELETE USER: Preserve all records when user is deleted
-- Delete only removes user account, keeps all their work/progress

-- SOP Competencies - SET NULL (preserves competency records for historical tracking)
ALTER TABLE sop_competencies
DROP CONSTRAINT IF EXISTS sop_competencies_user_id_fkey;
ALTER TABLE sop_competencies
ADD CONSTRAINT sop_competencies_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Pipeline Certifications - SET NULL (preserves certification records)
ALTER TABLE pipeline_certifications
DROP CONSTRAINT IF EXISTS pipeline_certifications_user_id_fkey;
ALTER TABLE pipeline_certifications
ADD CONSTRAINT pipeline_certifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Student Uploads - SET NULL (preserves uploaded assignments)
ALTER TABLE student_uploads
DROP CONSTRAINT IF EXISTS student_uploads_user_id_fkey;
ALTER TABLE student_uploads
ADD CONSTRAINT student_uploads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Student Uploads (reviewer_id) - SET NULL
ALTER TABLE student_uploads
DROP CONSTRAINT IF EXISTS student_uploads_reviewer_id_fkey;
ALTER TABLE student_uploads
ADD CONSTRAINT student_uploads_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL;

-- Chat Messages - SET NULL (preserves chat history)
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Chat Messages (deleted_by) - SET NULL instead of CASCADE
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_deleted_by_fkey;
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Announcements (author_id) - SET NULL instead of CASCADE
ALTER TABLE announcements
DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
ALTER TABLE announcements
ADD CONSTRAINT announcements_author_id_fkey
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- Curriculum Materials (uploaded_by) - SET NULL instead of CASCADE
ALTER TABLE curriculum_materials
DROP CONSTRAINT IF EXISTS curriculum_materials_uploaded_by_fkey;
ALTER TABLE curriculum_materials
ADD CONSTRAINT curriculum_materials_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;