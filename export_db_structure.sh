#!/bin/bash
# Script to export the complete database structure for easy import into a new Supabase project

PROJECT_REF="your-project-ref"  # Your Supabase project reference ID
OUTPUT_DIR="./db_structure"
SCHEMA_FILE="$OUTPUT_DIR/schema.sql"
INIT_FILE="$OUTPUT_DIR/init.sql"
COMBINED_FILE="$OUTPUT_DIR/webnex_db_structure.sql"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🔄 Exporting database structure from Supabase project $PROJECT_REF..."

# Extract schema only (no data)
echo "📄 Extracting schema..."
supabase db dump --project-ref "$PROJECT_REF" --schema-only --file "$SCHEMA_FILE"

# Create initialization file with custom SQL
echo "📝 Creating initialization file..."
cat > "$INIT_FILE" << 'EOL'
-- WebNex Database Initialization
-- This file contains the SQL to initialize a new Supabase project with the WebNex database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'client', 'staff');
  END IF;
END $$;

-- Create set_updated_at function for triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create has_role function to check user roles
CREATE OR REPLACE FUNCTION has_role(user_uuid uuid, required_role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = required_role
  );
END;
$$ LANGUAGE plpgsql;

-- Create is_admin helper function
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Create users_with_email view
CREATE OR REPLACE VIEW users_with_email AS
SELECT au.id, au.email
FROM auth.users au;

-- Grant select permission to authenticated users
GRANT SELECT ON users_with_email TO authenticated;
EOL

# Combine files
echo "🔄 Combining files..."
cat "$INIT_FILE" "$SCHEMA_FILE" > "$COMBINED_FILE"

# Add instructions at the end of the combined file
cat >> "$COMBINED_FILE" << 'EOL'

-- Final setup: Create initial admin user
-- Replace 'admin@example.com' with your actual admin email
DO $$ 
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for the admin email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;
  
  -- If the user exists, assign admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found. Please create a user with email admin@example.com first.';
  END IF;
END $$;
EOL

echo "✅ Database structure export complete!"
echo "📄 Combined SQL file saved to: $COMBINED_FILE"
echo ""
echo "To import this structure into a new Supabase project:"
echo "1. Create a new Supabase project"
echo "2. Go to the SQL Editor in the Supabase Dashboard"
echo "3. Copy and paste the contents of $COMBINED_FILE"
echo "4. Execute the SQL"
echo "5. Create a user with the email specified in the admin setup section"
echo "6. Run the final admin setup section again to assign the admin role"
