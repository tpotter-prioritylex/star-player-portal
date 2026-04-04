# Supabase Database Setup

This directory contains all the SQL migrations needed to set up the PriorityLex Star Player Training Portal database.

## Quick Setup

### Option 1: All-in-One Setup
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `setup.sql`
4. Run the script
5. Follow the post-setup instructions below

### Option 2: Step-by-Step Migration
Run each migration file in order in the Supabase SQL Editor:

1. `001_schema.sql` - Creates all database tables and indexes
2. `002_rls.sql` - Sets up Row Level Security policies
3. `003_seed.sql` - Inserts initial data (groups, training days, etc.)
4. `004_storage.sql` - Creates storage buckets and policies

## Post-Setup Steps

### 1. Create Admin User
After running the migrations, create your first admin user:

```sql
-- First, create the auth user through Supabase Auth Admin API or dashboard
-- Then insert the user profile:

INSERT INTO users (id, email, full_name, role, group_id) VALUES
  ('your-admin-user-id-from-auth-users', 'admin@prioritylex.com', 'Thomas Potter', 'admin', NULL);
```

### 2. Create Storage Buckets (if not auto-created)
If the storage buckets weren't created automatically, create them manually:

1. Go to **Storage** in Supabase dashboard
2. Create bucket: `curriculum-materials` (public)
3. Create bucket: `student-uploads` (private)

### 3. Test the Application
1. Start your React app: `npm run dev`
2. Log in with the admin credentials
3. Create test users through the User Management interface
4. Test various functionality

## Database Schema Overview

### Core Tables
- **users** - User profiles linked to Supabase auth
- **groups** - Training groups (1-6 for Cohort 2)
- **training_days** - 10-day curriculum structure
- **curriculum_materials** - Files/resources for each day
- **student_uploads** - Student assignment submissions
- **chat_channels** - Group and cohort chat channels
- **chat_messages** - Chat message history
- **sop_competencies** - Individual SOP progress tracking
- **pipeline_certifications** - Tool certification progress
- **announcements** - Admin/instructor announcements

### Storage Buckets
- **curriculum-materials** - Training files (public for authenticated users)
- **student-uploads** - Student submissions (private, role-based access)

### Auto-Generated Data
When a new Star Player is created, the system automatically:
- Creates 20 SOP competency records (A-1 through F-2)
- Creates 10 pipeline certification records
- Sets all statuses to "not_started"

## Permissions Summary

| Feature | Admin | Instructor | Star Player |
|---------|-------|------------|-------------|
| User Management | Full | None | None |
| Group Assignment | Full | None | None |
| Upload Curriculum | Yes | Yes | No |
| Review Uploads | All | All | Own only |
| Group Chat Access | All | All | Own group |
| Cohort Chat | Yes | Yes | Yes |
| Progress Editing | All | All | View own |
| Announcements | Full | Create | View |

## Troubleshooting

### Common Issues

**RLS Policy Errors**
- Ensure all policies are created after the helper functions
- Check that `get_user_role()` and `get_user_group()` functions exist

**Storage Access Issues**
- Verify bucket policies reference the correct bucket names
- Check that storage buckets are created with correct public/private settings

**User Creation Failures**
- Ensure the admin user has been created and added to the users table
- Check that the auth.users record exists before inserting into users table

### Useful Queries

Check if setup completed successfully:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check groups were created
SELECT * FROM groups ORDER BY id;

-- Check training days were created  
SELECT day_number, title FROM training_days ORDER BY day_number;

-- Check chat channels were created
SELECT name, type FROM chat_channels ORDER BY id;
```

Check user and permissions:
```sql
-- Check if admin user exists
SELECT id, email, role FROM users WHERE role = 'admin';

-- Test permission functions
SELECT get_user_role('your-user-id');
SELECT get_user_group('your-user-id');
```

## Support

If you encounter issues during setup, check the Supabase logs and ensure your project has the required extensions enabled. All SQL statements should run without errors in a fresh Supabase project.