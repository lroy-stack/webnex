/*
  # Fix Project Milestones and Updates RLS Policies
  
  This migration addresses issues with:
  1. Row-level security policies for project-related tables
  2. Creates new insert policies for project_milestones and project_updates tables
*/

-- Project Updates table - Add specific policies for insertions
DROP POLICY IF EXISTS "Allow admins to insert project updates" ON public.project_updates;
CREATE POLICY "Allow admins to insert project updates" 
  ON public.project_updates 
  FOR INSERT 
  TO public 
  WITH CHECK (
    -- Admin can insert for any project
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add system policy to allow system-generated updates (admin_id will be a UUID constant)
DROP POLICY IF EXISTS "Allow system to insert project updates" ON public.project_updates;
CREATE POLICY "Allow system to insert project updates" 
  ON public.project_updates 
  FOR INSERT 
  TO public 
  WITH CHECK (
    -- This allows rows with a specific admin_id pattern (for system)
    admin_id = '00000000-0000-0000-0000-000000000000'
  );

-- Project Milestones table - Add policies for all operations
DROP POLICY IF EXISTS "Admins can manage all project milestones" ON public.project_milestones;
CREATE POLICY "Admins can manage all project milestones" 
  ON public.project_milestones 
  FOR ALL
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow insertions of project milestones by the project owner
DROP POLICY IF EXISTS "Project owners can insert project milestones" ON public.project_milestones;
CREATE POLICY "Project owners can insert project milestones" 
  ON public.project_milestones 
  FOR INSERT
  TO public 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_projects
      WHERE client_projects.id = project_milestones.project_id
      AND client_projects.user_id = auth.uid()
    )
  );

-- Allow system to create project milestones
DROP POLICY IF EXISTS "System can create project milestones" ON public.project_milestones;
CREATE POLICY "System can create project milestones" 
  ON public.project_milestones 
  FOR INSERT 
  TO public 
  WITH CHECK (true); -- This broadly allows inserts for system/service-role operations

-- Project Forms table - Add policies for all operations
DROP POLICY IF EXISTS "Admins can manage all project forms" ON public.project_forms;
CREATE POLICY "Admins can manage all project forms" 
  ON public.project_forms 
  FOR ALL
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow system to create project forms
DROP POLICY IF EXISTS "System can create project forms" ON public.project_forms;
CREATE POLICY "System can create project forms" 
  ON public.project_forms 
  FOR INSERT
  TO public 
  WITH CHECK (true); -- This broadly allows inserts for system/service-role operations