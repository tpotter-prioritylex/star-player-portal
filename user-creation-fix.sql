DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "New users can create profile" ON users;

CREATE POLICY "Admin full access" ON users
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "New users can create profile" ON users
  FOR INSERT WITH CHECK (
    id = auth.uid() AND
    auth.uid() IS NOT NULL
  );