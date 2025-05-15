#!/bin/bash
# Supabase Project Backup Script
# This script creates a comprehensive backup of a Supabase project

# Exit on error
set -e

# Configuration
PROJECT_REF="your-project-ref"  # Your Supabase project reference ID
BACKUP_TYPE="${1:-daily}"  # Default to 'daily' if not specified
BACKUP_ROOT="./supabase_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATESTAMP=$(date +%F)

# Create backup directory structure
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_TYPE}_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/storage"
mkdir -p "$BACKUP_DIR/functions"

echo "🔄 Starting $BACKUP_TYPE backup of Supabase project $PROJECT_REF..."
echo "📂 Backup will be stored in $BACKUP_DIR"

# Set client messages to warning to reduce noise
echo "SET client_min_messages TO warning;" > "$BACKUP_DIR/backup_webnex_$DATESTAMP.sql"

# 1. Database Backup (Schema and Data)
echo "🗃️ Creating database dump..."
supabase db dump --project-ref "$PROJECT_REF" --data --file "$BACKUP_DIR/backup_webnex_$DATESTAMP.sql"

# 2. Storage Buckets (Files)
echo "📦 Backing up storage buckets..."
supabase storage list-buckets --project-ref "$PROJECT_REF" | jq -r '.[].name' | while read -r bucket; do
  echo "  📁 Backing up bucket: $bucket"
  mkdir -p "$BACKUP_DIR/storage/$bucket"
  supabase storage download -b "$bucket" --project-ref "$PROJECT_REF" --out "$BACKUP_DIR/storage/$bucket"
done

# 3. Edge Functions
echo "⚡ Backing up Edge Functions..."
supabase functions pull --project-ref "$PROJECT_REF" --out "$BACKUP_DIR/functions"

# 4. Project Settings (Configuration)
echo "⚙️ Backing up project settings..."
supabase projects retrieve "$PROJECT_REF" > "$BACKUP_DIR/project_settings_$DATESTAMP.json"

# 5. Verification
echo "✅ Verifying backup artifacts..."
echo "Database dump size: $(du -sh "$BACKUP_DIR/backup_webnex_$DATESTAMP.sql" | awk '{print $1}')"
echo "Storage backup size: $(du -sh "$BACKUP_DIR/storage/" | awk '{print $1}')"
echo "Functions backup size: $(du -sh "$BACKUP_DIR/functions/" | awk '{print $1}')"
echo "Settings file size: $(du -sh "$BACKUP_DIR/project_settings_$DATESTAMP.json" | awk '{print $1}')"

# 6. Compression
echo "🗜️ Compressing backup..."
ARCHIVE_NAME="${BACKUP_TYPE}_webnex_backup_${DATESTAMP}.tar.gz"
tar -czf "$ARCHIVE_NAME" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
echo "📦 Compressed backup created: $ARCHIVE_NAME"

# 7. Create a backup report
echo "📋 Creating backup report..."
cat > "${BACKUP_ROOT}/backup_report_${DATESTAMP}.txt" << EOF
Backup Report - ${DATESTAMP}

Backup Type: ${BACKUP_TYPE}
Project Reference: ${PROJECT_REF}
Timestamp: ${TIMESTAMP}
Backup Directory: ${BACKUP_DIR}
Compressed Archive: ${ARCHIVE_NAME}

Sizes:
- Database dump: $(du -sh "$BACKUP_DIR/backup_webnex_$DATESTAMP.sql" | awk '{print $1}')
- Storage backup: $(du -sh "$BACKUP_DIR/storage/" | awk '{print $1}')
- Functions backup: $(du -sh "$BACKUP_DIR/functions/" | awk '{print $1}')
- Settings file: $(du -sh "$BACKUP_DIR/project_settings_$DATESTAMP.json" | awk '{print $1}')
- Compressed archive: $(du -sh "$ARCHIVE_NAME" | awk '{print $1}')

Timestamps:
- Created: $(date)
- Expires: $(date -d "+30 days" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -v +30d "+%Y-%m-%d %H:%M:%S")

Backup Contents:
- Database tables and data
- Edge functions: $(find "$BACKUP_DIR/functions" -mindepth 1 -maxdepth 1 -type d | wc -l)
- Storage buckets: $(find "$BACKUP_DIR/storage" -mindepth 1 -maxdepth 1 -type d | wc -l)
EOF

echo "
🔐 $BACKUP_TYPE Backup Complete!

Backup archive: $ARCHIVE_NAME
Backup report: ${BACKUP_ROOT}/backup_report_${DATESTAMP}.txt

Next steps:
1. Store '$ARCHIVE_NAME' in a secure location
2. Consider uploading to cloud storage (AWS S3, Google Drive, etc.)
3. Review the backup report for details
"

# If run with --auto-clean, remove the temporary directory
if [ "$2" == "--auto-clean" ]; then
  echo "🧹 Removing temporary backup directory..."
  rm -rf "$BACKUP_DIR"
fi
