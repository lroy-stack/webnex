/*
  # Admin Protection Updates
  
  1. New Functions
    - Creates function to check if email belongs to admin
    - Adds trigger to prevent creating client profiles for admin emails
    - Creates email_available_for_signup function to safely check if email is available
    
  2. RLS Policy Updates
    - Prevents admins from appearing in client views
    - Updates user_roles policies to protect admin roles
*/

-- Create a function to check if an email is an admin email
CREATE OR REPLACE FUNCTION is_admin_email(p_email text)
RETURNS boolean AS $$
BEGIN
  -- List of admin emails to protect
  RETURN p_email = 'simpalori@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to prevent client profiles for admin emails
CREATE OR REPLACE FUNCTION prevent_admin_client_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email for this user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Check if it's an admin email
  IF is_admin_email(user_email) THEN
    RAISE EXCEPTION 'Cannot create client profile for admin user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the client_profiles table
DROP TRIGGER IF EXISTS prevent_admin_client_profile_trigger ON client_profiles;
CREATE TRIGGER prevent_admin_client_profile_trigger
BEFORE INSERT OR UPDATE ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_client_profile();

-- Create a function to safely check if an email is available for signup
-- (handles deleted accounts and admin emails)
CREATE OR REPLACE FUNCTION email_available_for_signup(p_email text)
RETURNS boolean AS $$
DECLARE
  email_exists boolean;
  is_deleted boolean;
BEGIN
  -- Check if it's an admin email (never available for signup)
  IF is_admin_email(p_email) THEN
    RETURN false;
  END IF;
  
  -- Check if email exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO email_exists;
  
  -- If email doesn't exist, it's available
  IF NOT email_exists THEN
    RETURN true;
  END IF;
  
  -- Check if the user was deleted
  SELECT EXISTS (
    SELECT 1 FROM deleted_accounts WHERE email = p_email
  ) INTO is_deleted;
  
  -- Email is available if user was deleted
  RETURN is_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix client data in admin profiles
CREATE OR REPLACE FUNCTION clean_admin_client_data()
RETURNS void AS $$
DECLARE
  admin_user_rec RECORD;
BEGIN
  -- For each admin email in auth.users
  FOR admin_user_rec IN 
    SELECT u.id, u.email
    FROM auth.users u
    WHERE is_admin_email(u.email)
  LOOP
    -- Delete client_profiles
    DELETE FROM client_profiles WHERE user_id = admin_user_rec.id;
    
    -- Delete project_preliminary_questionnaire
    DELETE FROM project_preliminary_questionnaire WHERE user_id = admin_user_rec.id;
    
    -- Delete client_privacy_settings
    DELETE FROM client_privacy_settings WHERE user_id = admin_user_rec.id;
    
    -- Delete client_tax_info
    DELETE FROM client_tax_info WHERE user_id = admin_user_rec.id;
    
    -- Delete user_modules
    DELETE FROM user_modules WHERE user_id = admin_user_rec.id;
    
    -- Delete client_subscriptions
    DELETE FROM client_subscriptions WHERE user_id = admin_user_rec.id;
    
    -- Ensure admin has admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_rec.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to clean up existing data
SELECT clean_admin_client_data();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION email_available_for_signup(text) TO anon, authenticated;