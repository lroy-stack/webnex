#!/bin/bash
# Script to extract the complete database schema from Supabase

PROJECT_REF="your-project-ref"  # Your Supabase project reference ID
OUTPUT_FILE="schema.sql"

echo "🔄 Extracting database schema from Supabase project $PROJECT_REF..."

# Extract schema only (no data)
supabase db dump --project-ref "$PROJECT_REF" --schema-only --file "$OUTPUT_FILE"

echo "✅ Schema extraction complete!"
echo "📄 Schema saved to: $OUTPUT_FILE"
echo ""
echo "To import this schema into a new Supabase project:"
echo "1. Create a new Supabase project"
echo "2. Run: supabase db reset --project-ref YOUR_NEW_PROJECT_REF"
echo "3. Run: supabase db push --project-ref YOUR_NEW_PROJECT_REF --db-url postgresql://postgres:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/postgres"
