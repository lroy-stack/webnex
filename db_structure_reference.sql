-- WebNex Database Structure Reference
-- This file provides a reference of the main database tables and their relationships
-- For a complete schema, use the export_db_structure.sh script

-- Custom types
CREATE TYPE app_role AS ENUM ('admin', 'client', 'staff');

-- User roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Client profiles table
CREATE TABLE client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  postal_code text,
  city text,
  province text,
  country text DEFAULT 'España',
  tax_id text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Services table
CREATE TABLE my_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  price integer NOT NULL,
  category text,
  features jsonb DEFAULT '[]'::jsonb,
  image_url text,
  is_active boolean DEFAULT true,
  position integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Packs table
CREATE TABLE my_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  price integer NOT NULL,
  type text DEFAULT 'standard',
  target text,
  features jsonb DEFAULT '[]'::jsonb,
  included_services jsonb DEFAULT '[]'::jsonb,
  color text DEFAULT 'bg-blue-500',
  image_url text,
  is_active boolean DEFAULT true,
  position integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Client projects table
CREATE TABLE client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'pending' NOT NULL,
  start_date timestamptz,
  expected_end_date timestamptz,
  actual_end_date timestamptz,
  estimated_completion_days integer DEFAULT 30,
  pack_id uuid REFERENCES my_packs(id),
  services jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Project milestones table
CREATE TABLE project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES client_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Project updates table
CREATE TABLE project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES client_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  update_type text DEFAULT 'general',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Project progress table
CREATE TABLE project_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Shopping cart table
CREATE TABLE shopping_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Shopping cart items table
CREATE TABLE shopping_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES shopping_cart(id) ON DELETE CASCADE NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Chat conversations table
CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES auth.users(id),
  title text DEFAULT 'Nueva conversación',
  client_deleted_at timestamptz,
  admin_deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Chat messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_admin boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Contact messages table
CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Onboarding form templates table
CREATE TABLE onboarding_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  title text NOT NULL,
  description text,
  structure jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (form_type)
);

-- Project preliminary questionnaire table
CREATE TABLE project_preliminary_questionnaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name text,
  project_description text,
  target_audience text,
  design_preferences jsonb DEFAULT '{}'::jsonb,
  required_features text[],
  business_goals text,
  timeline text,
  budget_range text,
  inspiration_urls text[],
  competitors text[],
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User stats table
CREATE TABLE user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL,
  logins integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  project_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, month)
);

-- System constants table
CREATE TABLE system_constants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Views
CREATE OR REPLACE VIEW users_with_email AS
SELECT au.id, au.email
FROM auth.users au;

CREATE OR REPLACE VIEW client_onboarding_status AS
SELECT 
  u.id as user_id, 
  u.email,
  cp.id as profile_id,
  cp.business_name,
  cp.first_name,
  cp.last_name,
  cp.onboarding_completed,
  CASE 
    WHEN cp.id IS NULL THEN false
    ELSE true
  END as has_profile,
  CASE
    WHEN ppq.id IS NULL THEN false
    ELSE true
  END as has_questionnaire,
  cp.created_at as profile_created_at,
  ppq.created_at as questionnaire_created_at
FROM 
  auth.users u
LEFT JOIN 
  client_profiles cp ON u.id = cp.user_id
LEFT JOIN 
  project_preliminary_questionnaire ppq ON u.id = ppq.user_id;

-- Note: This is a simplified reference. For complete schema with all functions, 
-- triggers, and RLS policies, use the export_db_structure.sh script.
