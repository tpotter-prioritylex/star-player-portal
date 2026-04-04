-- Fix RLS policies to allow initial admin user creation
-- Run this in your Supabase SQL Editor

-- Drop existing policies that may cause issues
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Create new policy that allows any authenticated user to insert the first admin user
-- and allows existing admin users to insert others
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (
    -- Allow if no admin users exist yet (bootstrap case)
    NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') OR
    -- Or if current user is already an admin
    get_user_role(auth.uid()) = 'admin'
  );

-- Also temporarily disable the constraint that requires auth.users reference
-- We'll handle auth separately for development
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;