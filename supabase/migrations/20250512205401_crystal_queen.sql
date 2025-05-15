/*
  # Enable Realtime for Project Tables

  1. Changes
     - Enables realtime for project-related tables
     - Sets REPLICA IDENTITY to FULL for all tables
     - Adds tables to publication only if they aren't already members
*/

-- Function to check if a table is in the publication
CREATE OR REPLACE FUNCTION is_table_in_publication(publication_name text, table_name text) RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = publication_name 
    AND schemaname = 'public' 
    AND tablename = table_name
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for project_updates table
ALTER TABLE project_updates REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'project_updates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_updates;
  END IF;
END $$;

-- Enable realtime for project_milestones table
ALTER TABLE project_milestones REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'project_milestones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_milestones;
  END IF;
END $$;

-- Enable realtime for client_projects table
ALTER TABLE client_projects REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'client_projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE client_projects;
  END IF;
END $$;

-- Cleanup the function when done
DROP FUNCTION is_table_in_publication;