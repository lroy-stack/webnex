#!/bin/bash
# Setup script for scheduled Supabase backups

# Create backup directory
mkdir -p ~/supabase_backups

# Copy backup script to user's bin directory
cp backup_supabase.sh ~/bin/backup_supabase.sh
chmod +x ~/bin/backup_supabase.sh

# Create rotation script
cat > ~/bin/rotate_backups.sh << 'EOL'
#!/bin/bash
# Script to rotate backups based on retention policy

BACKUP_DIR=~/supabase_backups

# Remove daily backups older than 7 days
find $BACKUP_DIR -name "daily_*" -type f -mtime +7 -delete

# Remove weekly backups older than 30 days
find $BACKUP_DIR -name "weekly_*" -type f -mtime +30 -delete

# Remove monthly backups older than 365 days
find $BACKUP_DIR -name "monthly_*" -type f -mtime +365 -delete

echo "Backup rotation completed on $(date)"
EOL

chmod +x ~/bin/rotate_backups.sh

# Create daily backup cron job
(crontab -l 2>/dev/null || echo "") | grep -v "backup_supabase.sh" | { cat; echo "0 1 * * * ~/bin/backup_supabase.sh > ~/supabase_backups/backup_daily.log 2>&1"; } | crontab -

# Create weekly backup cron job
(crontab -l 2>/dev/null || echo "") | grep -v "backup_supabase.sh weekly" | { cat; echo "0 2 * * 0 ~/bin/backup_supabase.sh weekly > ~/supabase_backups/backup_weekly.log 2>&1"; } | crontab -

# Create monthly backup cron job
(crontab -l 2>/dev/null || echo "") | grep -v "backup_supabase.sh monthly" | { cat; echo "0 3 1 * * ~/bin/backup_supabase.sh monthly > ~/supabase_backups/backup_monthly.log 2>&1"; } | crontab -

# Create backup rotation cron job
(crontab -l 2>/dev/null || echo "") | grep -v "rotate_backups.sh" | { cat; echo "0 4 * * * ~/bin/rotate_backups.sh > ~/supabase_backups/rotation.log 2>&1"; } | crontab -

echo "Cron jobs for Supabase backups have been set up:"
echo "- Daily backups at 1:00 AM"
echo "- Weekly backups at 2:00 AM on Sundays"
echo "- Monthly backups at 3:00 AM on the 1st day of each month"
echo "- Backup rotation at 4:00 AM daily"
echo
echo "Logs will be saved to ~/supabase_backups/"
echo "View your cron jobs with: crontab -l"