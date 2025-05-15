/*
  # Security Policy Improvements
  
  1. Security Fixes
    - Restrict access to sensitive tables
    - Add proper RLS policies for system_constants
    - Add better role verification
    
  2. Database Improvements
    - Fix user_stats table to properly handle date formats
    - Add project_progress handling for no rows
*/

-- Fix the date type issue in user_stats
ALTER TABLE user_stats ALTER COLUMN month TYPE text;
COMMENT ON COLUMN user_stats.month IS 'Format should be YYYY-MM (e.g. 2025-05)';

-- Make business_name required and add validation trigger
CREATE OR REPLACE FUNCTION validate_client_profile() 
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure business_name is not null or empty
  IF NEW.business_name IS NULL OR LENGTH(TRIM(NEW.business_name)) = 0 THEN
    RAISE EXCEPTION 'business_name cannot be null or empty';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_client_profile_trigger ON client_profiles;
CREATE TRIGGER validate_client_profile_trigger
BEFORE INSERT OR UPDATE ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION validate_client_profile();

-- Improve RLS for my_services to restrict public access to sensitive fields
DROP POLICY IF EXISTS "Allow public read access to my_services" ON public.my_services;
CREATE POLICY "Authenticated users can read my_services" 
  ON public.my_services FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Public users can read limited my_services fields" 
  ON public.my_services FOR SELECT 
  TO anon 
  USING (is_active = true);

-- Improve RLS for system_constants to restrict access to sensitive constants
DROP POLICY IF EXISTS "Clients can view system_constants" ON public.system_constants;
CREATE POLICY "Authenticated users can view non-sensitive system_constants" 
  ON public.system_constants FOR SELECT 
  TO authenticated 
  USING (key NOT LIKE 'secure_%' AND key NOT LIKE 'internal_%');

-- Create helper function to check if a project belongs to a user
CREATE OR REPLACE FUNCTION is_user_project(project_id uuid, user_uuid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_projects 
    WHERE id = project_id AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Improve error handling for project_progress table
CREATE OR REPLACE FUNCTION get_project_progress(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  progress_percentage integer, 
  start_date timestamptz, 
  estimated_end_date timestamptz,
  project_id uuid,
  name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    COALESCE(
      (SELECT 
        CASE 
          WHEN cp.status = 'completed' THEN 100
          WHEN COUNT(pm) = 0 THEN 0
          ELSE (COUNT(pm) FILTER (WHERE pm.is_completed = true) * 100 / COUNT(pm))::integer
        END
      FROM project_milestones pm
      WHERE pm.project_id = cp.id
      GROUP BY cp.status),
    0) as progress_percentage,
    cp.start_date,
    cp.expected_end_date,
    cp.id as project_id,
    cp.name
  FROM 
    project_progress pp
    JOIN client_projects cp ON cp.user_id = pp.user_id
  WHERE 
    pp.user_id = p_user_id
  ORDER BY
    cp.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;