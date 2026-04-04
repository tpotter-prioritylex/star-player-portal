-- PriorityLex Star Player Training Portal Storage Setup
-- Migration 004: Storage Buckets and Policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('curriculum-materials', 'curriculum-materials', true),
  ('student-uploads', 'student-uploads', false);

-- CURRICULUM MATERIALS BUCKET POLICIES
-- Public read for authenticated users
CREATE POLICY "Curriculum materials are publicly readable for authenticated users"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'curriculum-materials' AND auth.role() = 'authenticated');

-- Admin and instructor can upload
CREATE POLICY "Admin and instructor can upload curriculum materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

-- Admin and instructor can update/delete
CREATE POLICY "Admin and instructor can update curriculum materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

CREATE POLICY "Admin and instructor can delete curriculum materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'curriculum-materials' AND
    get_user_role(auth.uid()) IN ('admin', 'instructor')
  );

-- STUDENT UPLOADS BUCKET POLICIES
-- Users can only see their own uploads, admin/instructor can see all
CREATE POLICY "Users can view accessible student uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-uploads' AND (
      get_user_role(auth.uid()) IN ('admin', 'instructor') OR
      (auth.uid()::text = (string_to_array(name, '/'))[3]) -- Extract user_id from path
    )
  );

-- Star players can upload to their own directory only
CREATE POLICY "Star players can upload to own directory"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3] AND -- Must upload to their own user folder
    (string_to_array(name, '/'))[1] = 'group-' || get_user_group(auth.uid())::text -- Must upload to their group folder
  );

-- Star players can update their own files
CREATE POLICY "Star players can update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3]
  );

-- Star players can delete their own files
CREATE POLICY "Star players can delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'star_player' AND
    auth.uid()::text = (string_to_array(name, '/'))[3]
  );

-- Admin can manage all files
CREATE POLICY "Admin can manage all student uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'admin'
  );

-- Instructors can view and download all files but not upload or delete
CREATE POLICY "Instructors can view all student uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-uploads' AND
    get_user_role(auth.uid()) = 'instructor'
  );