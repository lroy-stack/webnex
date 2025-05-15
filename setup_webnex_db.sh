#!/bin/bash
# WebNex Database Setup Script
# This script guides you through setting up the WebNex database in a new Supabase project

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI is not installed. Please install it first:"
  echo "npm install -g supabase"
  exit 1
fi

# Check if logged in to Supabase
supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Not logged in to Supabase. Please login first:"
  echo "supabase login"
  exit 1
fi

echo "🔄 WebNex Database Setup"
echo "========================"
echo ""
echo "This script will help you set up the WebNex database in a new Supabase project."
echo ""

# Ask for project reference
read -p "Enter your Supabase project reference: " PROJECT_REF

# Verify project exists
echo "🔍 Verifying project..."
supabase projects retrieve "$PROJECT_REF" &> /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Project not found. Please check your project reference and try again."
  exit 1
fi

echo "✅ Project verified!"
echo ""

# Ask for setup method
echo "Select setup method:"
echo "1. Import from migration files (recommended)"
echo "2. Import from reference SQL (basic tables only)"
echo "3. Export from existing project and import"
read -p "Enter your choice (1-3): " SETUP_METHOD

case $SETUP_METHOD in
  1)
    echo "🔄 Setting up database from migration files..."
    echo "📄 Applying migrations..."
    supabase db push --project-ref "$PROJECT_REF"
    ;;
  2)
    echo "🔄 Setting up database from reference SQL..."
    echo "📄 Executing SQL..."
    supabase db query --project-ref "$PROJECT_REF" --file "db_structure_reference.sql"
    ;;
  3)
    echo "🔄 Exporting database structure from existing project..."
    read -p "Enter the source project reference: " SOURCE_PROJECT_REF
    
    # Create output directory
    mkdir -p db_structure
    
    # Extract schema
    echo "📄 Extracting schema..."
    supabase db dump --project-ref "$SOURCE_PROJECT_REF" --schema-only --file "db_structure/schema.sql"
    
    # Create initialization file
    echo "📝 Creating initialization file..."
    cat > "db_structure/init.sql" << 'EOL'
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
    cat "db_structure/init.sql" "db_structure/schema.sql" > "db_structure/webnex_db_structure.sql"
    
    # Import to new project
    echo "📄 Importing to new project..."
    supabase db query --project-ref "$PROJECT_REF" --file "db_structure/webnex_db_structure.sql"
    ;;
  *)
    echo "❌ Invalid choice. Exiting."
    exit 1
    ;;
esac

# Set up admin user
echo ""
echo "🔄 Setting up admin user..."
read -p "Enter admin email: " ADMIN_EMAIL

# Create SQL to assign admin role
SQL_COMMAND="
DO \$\$ 
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for the admin email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = '$ADMIN_EMAIL' LIMIT 1;
  
  -- If the user exists, assign admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found. Please create a user with email $ADMIN_EMAIL first.';
  END IF;
END \$\$;
"

# Execute SQL command
echo "📄 Executing SQL command..."
supabase db query --project-ref "$PROJECT_REF" "$SQL_COMMAND"

echo ""
echo "✅ WebNex database setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a user with email $ADMIN_EMAIL if you haven't already"
echo "2. Run this script again to assign the admin role"
echo "3. Update your application's environment variables to use the new project reference"
echo "4. Test your application to ensure everything works as expected"
