# WebNex - Modular SaaS Web Development Platform

![WebNex Logo](https://ik.imagekit.io/insomnialz/webnex-logo.png?updatedAt=1746819797684)

## Project Overview

WebNex is a modular SaaS platform that allows clients to build their digital presence using customizable modules tailored to their business needs. The platform offers pre-designed packs and individual services that clients can mix and match to create their ideal web solution.

**URL**: https://webnex.app

## Features

### Client Features
- **Modular Web Solutions**: Choose from pre-designed packs or customize with individual modules
- **Client Dashboard**: Track project progress, access resources, and manage services
- **Real-time Chat**: Direct communication with the development team
- **Project Updates**: Receive notifications about project milestones and updates
- **Onboarding Process**: Guided setup for new clients
- **Shopping Cart**: Easy selection and purchase of services and packs

### Admin Features
- **Client Management**: Add, edit, and manage client accounts
- **Service Management**: Create and manage available services and packs
- **Project Management**: Track project progress and update clients
- **Chat System**: Communicate with clients in real-time
- **Analytics Dashboard**: Monitor platform performance and client activity
- **Configuration Panel**: Customize platform settings
- **Admin Tools**: Access specialized administrative tools

## Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite (Build tool)
  - Tailwind CSS (Styling)
  - shadcn/ui (UI Components)
  - React Router (Navigation)
  - Zustand (State Management)
  - React Query (Data Fetching)
  - Framer Motion (Animations)

- **Backend**:
  - Supabase (Backend as a Service)
  - PostgreSQL (Database)
  - Supabase Auth (Authentication)
  - Supabase Storage (File Storage)
  - Supabase Edge Functions (Serverless Functions)
  - Supabase Realtime (Real-time Subscriptions)

## Project Structure

```
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin panel components
│   │   ├── auth/            # Authentication components
│   │   ├── cart/            # Shopping cart components
│   │   ├── chat/            # Chat functionality components
│   │   ├── client/          # Client dashboard components
│   │   ├── common/          # Shared components
│   │   ├── contact/         # Contact form components
│   │   ├── home/            # Homepage components
│   │   ├── layout/          # Layout components
│   │   ├── onboarding/      # Onboarding process components
│   │   ├── packs/           # Service packs components
│   │   ├── profile/         # User profile components
│   │   ├── project/         # Project management components
│   │   └── ui/              # UI components (shadcn/ui)
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── services/            # API service functions
│   ├── store/               # Zustand stores
│   └── utils/               # Utility functions
├── supabase/
│   ├── functions/           # Supabase Edge Functions
│   └── migrations/          # Database migrations
```

## Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Supabase CLI

### Local Development Setup

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd webnex
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.development` to `.env.local` and update the values as needed

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Configuration

The application uses the following environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Setup

The project uses Supabase as its database and backend service. The database schema is defined in the migration files located in the `supabase/migrations` directory.

### Setting Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Install the Supabase CLI:
   ```sh
   npm install -g supabase
   ```
3. Link your project:
   ```sh
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

### Database Structure Export and Import

This project includes scripts to export the complete database structure and import it into a new Supabase project. This allows anyone who downloads the repository to easily set up the backend.

#### Exporting the Database Structure

To export the database structure from an existing Supabase project:

1. Make the script executable:
   ```sh
   chmod +x export_db_structure.sh
   ```

2. Run the script:
   ```sh
   ./export_db_structure.sh
   ```

This will create a directory called `db_structure` containing:
- `schema.sql`: The raw schema dump from Supabase
- `init.sql`: Initialization SQL with custom types and functions
- `webnex_db_structure.sql`: Combined file ready for import

#### Importing the Database Structure

The easiest way to set up the WebNex database is to use the all-in-one setup script:

```bash
chmod +x setup_webnex_db.sh
./setup_webnex_db.sh
```

This interactive script will guide you through the entire setup process, including:
- Selecting a setup method (migration files, reference SQL, or export from existing project)
- Setting up an admin user
- Verifying the setup

Alternatively, you can manually import the database structure:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in the Supabase Dashboard
3. Copy and paste the contents of `db_structure/webnex_db_structure.sql`
4. Execute the SQL
5. Create a user with the email specified in the admin setup section (default: admin@example.com)
6. Run the final admin setup section again to assign the admin role

#### Database Schema Overview

The database includes the following key tables:

- **client_profiles**: Stores client information
- **my_services**: Available services that can be purchased
- **my_packs**: Service packs that combine multiple services
- **client_projects**: Client projects with status tracking
- **project_milestones**: Milestones for each project
- **project_updates**: Updates and notifications for projects
- **chat_conversations**: Chat conversations between clients and admins
- **chat_messages**: Individual chat messages
- **shopping_cart**: Shopping cart for services and packs
- **shopping_cart_items**: Items in the shopping cart
- **user_roles**: User role assignments (admin, client, staff)
- **onboarding_form_templates**: Templates for onboarding forms
- **project_preliminary_questionnaire**: Client's initial project requirements

Row Level Security (RLS) policies are implemented on all tables to ensure data security and proper access control based on user roles.

For a more detailed overview of the database structure, see:
- `DB_README.md`: Comprehensive guide to the database structure and setup
- `db_structure_reference.sql`: SQL reference of the main database tables
- `db_structure/`: Directory containing the exported database structure files

## Development Workflow

1. Create a new branch for your feature or bug fix
2. Make your changes
3. Run linting and type checking:
   ```sh
   npm run lint
   ```
4. Build the project to ensure it compiles correctly:
   ```sh
   npm run build
   ```
5. Submit a pull request

## Deployment

### Manual Deployment

1. Build the project:
   ```sh
   npm run build
   ```
2. Deploy the `dist` directory to your hosting provider of choice

## Backup and Restore

The project includes scripts for backing up and restoring your Supabase project:

### Prerequisites for Backup

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

### Backup Process

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

### Restoration Process

To restore from a backup:

#### Database Restoration

```bash
# For a new project
supabase db restore --project-ref NEW_PROJECT_REF --file PATH_TO_BACKUP.sql

# Using psql directly
psql -h DATABASE_HOST -U DATABASE_USER -d DATABASE_NAME -f PATH_TO_BACKUP.sql
```

#### Storage Restoration

```bash
# Create buckets if they don't exist
supabase storage create-bucket --project-ref NEW_PROJECT_REF --name BUCKET_NAME --public

# Upload files
find BACKUP_DIR/storage/BUCKET_NAME -type f | while read file; do
  relative_path=${file#BACKUP_DIR/storage/BUCKET_NAME/}
  supabase storage upload --project-ref NEW_PROJECT_REF --bucket BUCKET_NAME "$file" "$relative_path"
done
```

#### Edge Functions Deployment

```bash
cd BACKUP_DIR/functions
supabase functions deploy --project-ref NEW_PROJECT_REF FUNCTION_NAME
```

## Contributing

### How to Contribute

There are several ways to contribute to this project:

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## License

This project is proprietary software. All rights reserved.

---

© 2025 WebNex. All rights reserved.
