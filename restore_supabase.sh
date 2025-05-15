#!/bin/bash
# Supabase Project Restoration Script
# This script restores a Supabase project from a backup

# Exit on error
set -e

# Check if arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <backup_file.tar.gz> <new_project_ref>"
  echo "Example: $0 webnex_backup_2025-05-15.tar.gz new_project_ref"
  exit 1
fi

BACKUP_FILE="$1"
NEW_PROJECT_REF="$2"
TEMP_DIR="./temp_restore_$(date +%s)"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI is not installed. Please install it first:"
  echo "npm install -g supabase"
  exit 1
fi

echo "🔄 Starting restoration of Supabase project from $BACKUP_FILE to project $NEW_PROJECT_REF..."

# 1. Extract backup
echo "📂 Extracting backup..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the actual backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "supabase_backups*" -o -name "*_*_*" | head -1)

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ Could not find backup directory in the archive"
  exit 1
fi

echo "📂 Found backup directory: $BACKUP_DIR"

# 2. Restore database
echo "🗃️ Restoring database..."
DB_BACKUP=$(find "$BACKUP_DIR" -name "*.sql" | head -1)
if [ -z "$DB_BACKUP" ]; then
  echo "❌ No database backup found in $BACKUP_DIR"
  exit 1
fi

echo "📄 Using database backup: $DB_BACKUP"
supabase db restore --project-ref "$NEW_PROJECT_REF" --file "$DB_BACKUP"

# 3. Restore storage buckets
echo "📦 Restoring storage buckets..."
STORAGE_DIR="$BACKUP_DIR/storage"
if [ -d "$STORAGE_DIR" ]; then
  # For each bucket directory
  find "$STORAGE_DIR" -mindepth 1 -maxdepth 1 -type d | while read -r bucket_dir; do
    bucket_name=$(basename "$bucket_dir")
    echo "  📁 Restoring bucket: $bucket_name"
    
    # Create bucket if it doesn't exist
    supabase storage create-bucket --project-ref "$NEW_PROJECT_REF" --name "$bucket_name" --public || true
    
    # Upload files
    find "$bucket_dir" -type f | while read -r file_path; do
      relative_path=${file_path#$bucket_dir/}
      echo "    📄 Uploading: $relative_path"
      supabase storage upload --project-ref "$NEW_PROJECT_REF" --bucket "$bucket_name" "$file_path" "$relative_path"
    done
  done
else
  echo "⚠️ No storage directory found in backup"
fi

# 4. Restore Edge Functions
echo "⚡ Restoring Edge Functions..."
FUNCTIONS_DIR="$BACKUP_DIR/functions"
if [ -d "$FUNCTIONS_DIR" ]; then
  cd "$FUNCTIONS_DIR"
  
  # For each function directory
  find . -mindepth 1 -maxdepth 1 -type d | sed 's|^\./||' | while read -r function_name; do
    echo "  ⚙️ Deploying function: $function_name"
    supabase functions deploy --project-ref "$NEW_PROJECT_REF" "$function_name"
  done
  
  cd - > /dev/null
else
  echo "⚠️ No functions directory found in backup"
fi

# 5. Clean up
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "
✅ Restoration Complete!

Your Supabase project has been restored:
- Database schema and data
- Storage buckets and files
- Edge Functions

Next steps:
1. Update your application's environment variables to use the new project reference
2. Test your application to ensure everything works as expected
3. Set up backup for the new project

Project URL: https://app.supabase.com/project/$NEW_PROJECT_REF
"