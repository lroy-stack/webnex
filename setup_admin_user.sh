#!/bin/bash
# Script to set up an admin user in a Supabase project

# Check if arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <project_ref> <admin_email>"
  echo "Example: $0 your-project-ref admin@example.com"
  exit 1
fi

PROJECT_REF="$1"
ADMIN_EMAIL="$2"

echo "🔄 Setting up admin user with email $ADMIN_EMAIL in Supabase project $PROJECT_REF..."

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

echo "✅ Admin user setup complete!"
echo ""
echo "Next steps:"
echo "1. Sign in to your Supabase project with the admin email: $ADMIN_EMAIL"
echo "2. Update your application's environment variables to use the new project reference"
echo "3. Test your application to ensure everything works as expected"
