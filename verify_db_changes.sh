#!/bin/bash
# Script to verify database changes after restructuring

PROJECT_REF="your-project-ref"  # Your Supabase project reference ID

echo "🔍 Verifying database changes for project $PROJECT_REF..."

# Verify users_with_email view exists
echo "Checking users_with_email view..."
supabase db query --project-ref "$PROJECT_REF" "SELECT EXISTS (
  SELECT 1 FROM pg_views WHERE viewname = 'users_with_email'
);"

# Verify is_admin function
echo "Checking is_admin function..."
supabase db query --project-ref "$PROJECT_REF" "SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
);"

# Verify RLS policies on client_projects
echo "Checking RLS policies on client_projects..."
supabase db query --project-ref "$PROJECT_REF" "SELECT policyname, permissive, cmd
FROM pg_policies WHERE tablename = 'client_projects';"

# Verify admin_get_cart_items function
echo "Checking admin_get_cart_items function..."
supabase db query --project-ref "$PROJECT_REF" "SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'admin_get_cart_items'
);"

# Verify realtime publication configuration
echo "Checking realtime publication configuration..."
supabase db query --project-ref "$PROJECT_REF" "SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('project_updates', 'project_milestones', 'client_projects', 
                  'chat_conversations', 'chat_messages', 'shopping_cart_items');"

# Verify project milestones were added to projects
echo "Checking project milestones..."
supabase db query --project-ref "$PROJECT_REF" "SELECT
  cp.id as project_id,
  cp.name as project_name,
  COUNT(pm.id) as milestone_count
FROM
  client_projects cp
LEFT JOIN
  project_milestones pm ON cp.id = pm.project_id
GROUP BY
  cp.id, cp.name;"

echo "✅ Verification complete!"
