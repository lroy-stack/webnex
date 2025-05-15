/*
  # Create Onboarding Tables and Features

  1. New Tables
    - project_preliminary_questionnaire: Stores client's initial project requirements
    - onboarding_form_templates: Stores form structure and questions for different onboarding steps
    
  2. Modified Tables
    - client_profiles: Add onboarding_completed flag

  3. Views
    - client_onboarding_status: To track user onboarding completion status

  4. Functions
    - get_onboarding_forms: Retrieves form structure for the onboarding process
*/

-- Add onboarding_completed flag to client_profiles
ALTER TABLE client_profiles 
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Create table for preliminary project questionnaires
CREATE TABLE IF NOT EXISTS project_preliminary_questionnaire (
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

-- RLS for project_preliminary_questionnaire
ALTER TABLE project_preliminary_questionnaire ENABLE ROW LEVEL SECURITY;

-- Clients can insert their own questionnaire
CREATE POLICY "Users can insert their own questionnaire" 
  ON project_preliminary_questionnaire
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Clients can update their own questionnaire  
CREATE POLICY "Users can update their own questionnaire" 
  ON project_preliminary_questionnaire
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);
  
-- Clients can view their own questionnaire
CREATE POLICY "Users can view their own questionnaire" 
  ON project_preliminary_questionnaire
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);
  
-- Admins can view all questionnaires
CREATE POLICY "Admins can view all questionnaires" 
  ON project_preliminary_questionnaire
  FOR SELECT 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_project_preliminary_questionnaire_updated_at
  BEFORE UPDATE ON project_preliminary_questionnaire
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create onboarding form templates table
CREATE TABLE IF NOT EXISTS onboarding_form_templates (
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

-- RLS for onboarding_form_templates
ALTER TABLE onboarding_form_templates ENABLE ROW LEVEL SECURITY;

-- Admins can modify form templates
CREATE POLICY "Admins can do everything with form templates"
  ON onboarding_form_templates
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- All users can view form templates  
CREATE POLICY "All users can view active form templates"
  ON onboarding_form_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create trigger to update updated_at
CREATE TRIGGER update_onboarding_form_templates_updated_at
  BEFORE UPDATE ON onboarding_form_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert default onboarding form templates
INSERT INTO onboarding_form_templates (form_type, title, description, structure)
VALUES
(
  'profile_info',
  'Información de Perfil',
  'Complete su información personal para mejorar su experiencia',
  jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object(
        'id', 'first_name',
        'label', 'Nombre',
        'type', 'text',
        'placeholder', 'Su nombre',
        'required', true
      ),
      jsonb_build_object(
        'id', 'last_name',
        'label', 'Apellidos',
        'type', 'text',
        'placeholder', 'Sus apellidos',
        'required', true
      ),
      jsonb_build_object(
        'id', 'phone',
        'label', 'Teléfono',
        'type', 'tel',
        'placeholder', '+34 123 456 789',
        'required', true
      ),
      jsonb_build_object(
        'id', 'address',
        'label', 'Dirección',
        'type', 'text',
        'placeholder', 'Calle, número, piso',
        'required', false
      ),
      jsonb_build_object(
        'id', 'postal_code',
        'label', 'Código Postal',
        'type', 'text',
        'placeholder', '28001',
        'required', false
      ),
      jsonb_build_object(
        'id', 'city',
        'label', 'Ciudad',
        'type', 'text',
        'placeholder', 'Madrid',
        'required', false
      ),
      jsonb_build_object(
        'id', 'province',
        'label', 'Provincia',
        'type', 'text',
        'placeholder', 'Madrid',
        'required', false
      )
    )
  )
),
(
  'business_info',
  'Información de su Negocio',
  'Cuéntenos más sobre su empresa',
  jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object(
        'id', 'business_name',
        'label', 'Nombre de su Empresa',
        'type', 'text',
        'placeholder', 'Nombre de su empresa',
        'required', true
      ),
      jsonb_build_object(
        'id', 'website',
        'label', 'Sitio Web Actual (si existe)',
        'type', 'url',
        'placeholder', 'https://www.suempresa.com',
        'required', false
      ),
      jsonb_build_object(
        'id', 'industry',
        'label', 'Sector',
        'type', 'select',
        'options', jsonb_build_array(
          'Tecnología', 'Salud', 'Educación', 'Comercio', 'Hostelería', 
          'Construcción', 'Finanzas', 'Legal', 'Marketing', 'Otro'
        ),
        'required', true
      ),
      jsonb_build_object(
        'id', 'company_size',
        'label', 'Tamaño de la Empresa',
        'type', 'select',
        'options', jsonb_build_array(
          'Autónomo', '1-5 empleados', '6-20 empleados', '21-50 empleados', '51-200 empleados', 'Más de 200 empleados'
        ),
        'required', true
      )
    )
  )
),
(
  'project_needs',
  'Necesidades de su Proyecto Web',
  'Información sobre sus necesidades y objetivos web',
  jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object(
        'id', 'project_name',
        'label', 'Nombre del Proyecto',
        'type', 'text',
        'placeholder', 'Ej: Sitio Web de Mi Empresa',
        'required', true
      ),
      jsonb_build_object(
        'id', 'project_description',
        'label', 'Descripción del Proyecto',
        'type', 'textarea',
        'placeholder', 'Describa brevemente su proyecto web',
        'required', true
      ),
      jsonb_build_object(
        'id', 'target_audience',
        'label', 'Público Objetivo',
        'type', 'text',
        'placeholder', 'Ej: Profesionales entre 25-45 años',
        'required', true
      ),
      jsonb_build_object(
        'id', 'design_preferences',
        'label', 'Preferencias de Diseño',
        'type', 'checkbox-group',
        'options', jsonb_build_array(
          'Minimalista', 'Moderno', 'Corporativo', 'Creativo', 'Elegante', 
          'Colorido', 'Sencillo'
        ),
        'required', true
      ),
      jsonb_build_object(
        'id', 'required_features',
        'label', 'Funcionalidades Necesarias',
        'type', 'checkbox-group',
        'options', jsonb_build_array(
          'Formulario de Contacto', 'Catálogo de Productos', 'Blog', 'Tienda Online', 
          'Área de Clientes', 'Calendario/Reservas', 'Galería de Imágenes', 
          'Multi-idioma', 'Integraciones con Redes Sociales', 'Pasarela de Pago'
        ),
        'required', false
      ),
      jsonb_build_object(
        'id', 'business_goals',
        'label', 'Objetivos de Negocio',
        'type', 'textarea',
        'placeholder', '¿Qué espera conseguir con este sitio web?',
        'required', true
      ),
      jsonb_build_object(
        'id', 'timeline',
        'label', 'Plazo de Tiempo',
        'type', 'select',
        'options', jsonb_build_array(
          'Lo antes posible', '1-2 meses', '3-6 meses', 'Sin prisa'
        ),
        'required', false
      ),
      jsonb_build_object(
        'id', 'budget_range',
        'label', 'Rango de Presupuesto',
        'type', 'select',
        'options', jsonb_build_array(
          'Menos de 1.000€', '1.000€ - 2.500€', '2.500€ - 5.000€', '5.000€ - 10.000€', 'Más de 10.000€'
        ),
        'required', false
      ),
      jsonb_build_object(
        'id', 'inspiration_urls',
        'label', 'URLs de Inspiración',
        'type', 'textarea',
        'placeholder', 'Indique sitios web que le gusten (uno por línea)',
        'required', false
      ),
      jsonb_build_object(
        'id', 'notes',
        'label', 'Notas Adicionales',
        'type', 'textarea',
        'placeholder', 'Cualquier información adicional que considere relevante',
        'required', false
      )
    )
  )
);

-- Create a view to check onboarding status
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

-- Create function to get onboarding forms
CREATE OR REPLACE FUNCTION get_onboarding_forms(form_types text[] DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  form_type text,
  title text,
  description text,
  structure jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oft.id,
    oft.form_type,
    oft.title,
    oft.description,
    oft.structure
  FROM 
    onboarding_form_templates oft
  WHERE 
    oft.is_active = true 
    AND (form_types IS NULL OR oft.form_type = ANY(form_types))
  ORDER BY 
    CASE 
      WHEN oft.form_type = 'profile_info' THEN 1
      WHEN oft.form_type = 'business_info' THEN 2
      WHEN oft.form_type = 'project_needs' THEN 3
      ELSE 4
    END;
END;
$$;

-- Function to mark onboarding as completed
CREATE OR REPLACE FUNCTION complete_user_onboarding(user_uuid uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE client_profiles
  SET onboarding_completed = true,
      updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_onboarding_forms(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_user_onboarding(uuid) TO authenticated;