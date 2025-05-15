# Supabase Backup Documentation

This document provides comprehensive guidance for backing up and restoring your Supabase project.

## Prerequisites

Before running the backup script, ensure you have the following:

1. **Supabase CLI**: Install the latest version
   ```bash
   npm install -g supabase
   ```

2. **jq**: Command-line JSON processor
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   
   # Windows (with Chocolatey)
   choco install jq
   ```

3. **Authentication**: Log in to Supabase CLI
   ```bash
   supabase login
   ```

## Backup Script

The `backup_supabase.sh` script creates a comprehensive backup of your Supabase project, including:

- Database (schema and data)
- Storage buckets (files)
- Edge functions
- Project settings

### Usage

1. Make the script executable:
   ```bash
   chmod +x backup_supabase.sh
   ```

2. Run the script:
   ```bash
   ./backup_supabase.sh
   ```

3. Optional: Run with verification flag:
   ```bash
   ./backup_supabase.sh --verify
   ```

### Configuration

Edit the script to update:
- `PROJECT_REF`: Your Supabase project reference ID (from the URL)
- `BACKUP_DIR`: Where backups will be stored (default: `./supabase_backups/TIMESTAMP`)

## Backup Components

### 1. Database (Schema and Data)

The database backup includes:
- Table definitions
- Functions, triggers, and stored procedures
- Row-level security policies
- All data

### 2. Storage Buckets

All files from each storage bucket are downloaded to:
```
BACKUP_DIR/storage/BUCKET_NAME/
```

### 3. Edge Functions

Source code for all your edge functions is saved to:
```
BACKUP_DIR/functions/
```

### 4. Project Settings

Project configuration is stored in:
```
BACKUP_DIR/project_settings_YYYY-MM-DD.json
```

## Restoration Procedure

To restore from a backup:

### Database Restoration

```bash
# For a new project
supabase db restore --project-ref NEW_PROJECT_REF --file PATH_TO_BACKUP.sql

# Using psql directly
psql -h DATABASE_HOST -U DATABASE_USER -d DATABASE_NAME -f PATH_TO_BACKUP.sql
```

### Storage Restoration

```bash
# Create buckets if they don't exist
supabase storage create-bucket --project-ref NEW_PROJECT_REF --name BUCKET_NAME --public

# Upload files
find BACKUP_DIR/storage/BUCKET_NAME -type f | while read file; do
  relative_path=${file#BACKUP_DIR/storage/BUCKET_NAME/}
  supabase storage upload --project-ref NEW_PROJECT_REF --bucket BUCKET_NAME "$file" "$relative_path"
done
```

### Edge Functions Deployment

```bash
cd BACKUP_DIR/functions
supabase functions deploy --project-ref NEW_PROJECT_REF FUNCTION_NAME
```

## Backup Best Practices

1. **Scheduled Backups**: Run the backup script on a regular schedule (daily, weekly)

2. **Retention Policy**: Maintain multiple backups with different retention periods:
   - Daily backups: Keep for 7 days
   - Weekly backups: Keep for 1 month
   - Monthly backups: Keep for 1 year

3. **Secure Storage**: Store backups in multiple secure locations:
   - External hard drive
   - Cloud storage (AWS S3, Google Cloud Storage)
   - Version-controlled repository (for code and schema, not sensitive data)

4. **Encryption**: Encrypt your backup files before storing them:
   ```bash
   # Encrypt backup using GPG
   gpg --output webnex_backup.tar.gz.gpg --encrypt --recipient YOUR_EMAIL webnex_backup.tar.gz
   ```

5. **Testing**: Regularly test your backups by restoring to a test environment

## Disaster Recovery

In case of data loss or corruption:

1. Create a new Supabase project if necessary
2. Restore the database backup
3. Restore storage files
4. Deploy edge functions
5. Update DNS and client applications to use the new project URL

## Monitoring and Alerting

To ensure backups are working properly:

1. Set up alerts for backup failures
2. Monitor backup size and growth
3. Verify backup integrity periodically
4. Document the entire backup and restoration process