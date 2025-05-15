# WebNex Database Structure

This document provides information about the WebNex database structure and how to set it up in a new Supabase project.

## Overview

WebNex uses Supabase as its backend service, which is built on PostgreSQL. The database includes tables for:

- User management (profiles, roles)
- Services and packs
- Projects and milestones
- Chat functionality
- Shopping cart
- Onboarding process

## Database Schema

The database schema is defined in the migration files located in the `supabase/migrations` directory. For a quick reference of the main tables and their relationships, see the `db_structure_reference.sql` file.

## Setting Up the Database

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`
- A Supabase project created at [supabase.com](https://supabase.com)

### Option 1: Using the All-in-One Setup Script (Recommended)

The easiest way to set up the WebNex database is to use the all-in-one setup script:

```bash
chmod +x setup_webnex_db.sh
./setup_webnex_db.sh
```

This interactive script will guide you through the entire setup process, including:
- Selecting a setup method (migration files, reference SQL, or export from existing project)
- Setting up an admin user
- Verifying the setup

### Option 2: Using the Export Scripts

This repository includes scripts to export the complete database structure and import it into a new Supabase project:

1. **Extract Schema Only**

   ```bash
   chmod +x extract_schema.sh
   ./extract_schema.sh
   ```

   This will create a `schema.sql` file with just the database schema (no data).

2. **Export Complete Database Structure**

   ```bash
   chmod +x export_db_structure.sh
   ./export_db_structure.sh
   ```

   This will create a directory called `db_structure` containing:
   - `schema.sql`: The raw schema dump from Supabase
   - `init.sql`: Initialization SQL with custom types and functions
   - `webnex_db_structure.sql`: Combined file ready for import

### Option 3: Using the Reference SQL

For a simpler setup with just the basic tables (without all functions and RLS policies):

1. Create a new Supabase project
2. Go to the SQL Editor in the Supabase Dashboard
3. Copy and paste the contents of `db_structure_reference.sql`
4. Execute the SQL

Note: This option doesn't include all the functions and RLS policies, so some features may not work correctly.

### Option 4: Using the Migration Files

You can also apply the migration files directly:

1. Create a new Supabase project
2. Link your project: `supabase link --project-ref <your-project-ref>`
3. Apply migrations: `supabase db push`

## Row Level Security (RLS) Policies

WebNex uses Row Level Security (RLS) policies to control access to data based on user roles. The main roles are:

- **admin**: Can access and modify all data
- **client**: Can access and modify only their own data
- **staff**: Has limited access to client data for support purposes

The RLS policies are defined in the migration files and are included in the exported database structure.

## Important Tables

### User Management

- **user_roles**: Assigns roles to users (admin, client, staff)
- **client_profiles**: Stores client information

### Services and Packs

- **my_services**: Individual services that can be purchased
- **my_packs**: Service packs that combine multiple services

### Projects

- **client_projects**: Client projects with status tracking
- **project_milestones**: Milestones for each project
- **project_updates**: Updates and notifications for projects
- **project_progress**: Tracks project progress

### Chat

- **chat_conversations**: Chat conversations between clients and admins
- **chat_messages**: Individual chat messages

### Shopping Cart

- **shopping_cart**: Shopping cart for each user
- **shopping_cart_items**: Items in the shopping cart

### Onboarding

- **onboarding_form_templates**: Templates for onboarding forms
- **project_preliminary_questionnaire**: Client's initial project requirements

## Functions and Triggers

The database includes several functions and triggers to handle:

- Updating timestamps
- Checking user roles
- Managing project milestones
- Processing cart items
- Handling onboarding

For a complete list of functions and triggers, see the exported database structure.

## Setting Up an Admin User

After importing the database structure, you need to create an admin user:

### Option 1: Using the Setup Script

1. Create a user in Supabase Authentication
2. Make the script executable:
   ```bash
   chmod +x setup_admin_user.sh
   ```
3. Run the script with your project reference and admin email:
   ```bash
   ./setup_admin_user.sh your-project-ref admin@example.com
   ```

### Option 2: Manual Setup

1. Create a user in Supabase Authentication
2. Run the following SQL to assign the admin role:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Replace `YOUR_USER_ID` with the actual user ID from Supabase Authentication.

## Troubleshooting

If you encounter issues with the database setup:

1. Check the Supabase logs for error messages
2. Ensure all extensions are enabled
3. Verify that the user has the correct permissions
4. Check that all tables have RLS enabled and policies set correctly

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
