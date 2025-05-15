-- Enable RLS on client_projects if not already enabled
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON public.client_projects;
DROP POLICY IF EXISTS "Clients can view own projects" ON public.client_projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON public.client_projects;

-- Create policy for admins to view all projects
CREATE POLICY "Admins can view all projects" 
  ON public.client_projects 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to update all projects  
CREATE POLICY "Admins can update all projects" 
  ON public.client_projects 
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create policy for clients to view their own projects
CREATE POLICY "Clients can view own projects" 
  ON public.client_projects 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for clients to update their own projects
CREATE POLICY "Clients can update own projects" 
  ON public.client_projects 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
  
-- Enable RLS on project_milestones if not already enabled
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all project milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Admins can update all project milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Clients can view own project milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Clients can update own project milestones" ON public.project_milestones;

-- Create policy for admins to view all milestones
CREATE POLICY "Admins can view all project milestones" 
  ON public.project_milestones 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to manage all milestones
CREATE POLICY "Admins can update all project milestones" 
  ON public.project_milestones 
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create policy for clients to view their own project milestones by joining with projects
CREATE POLICY "Clients can view own project milestones" 
  ON public.project_milestones 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects
      WHERE client_projects.id = project_milestones.project_id
      AND client_projects.user_id = auth.uid()
    )
  );

-- Create policy for clients to update their own project milestones by joining with projects  
CREATE POLICY "Clients can update own project milestones" 
  ON public.project_milestones 
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects
      WHERE client_projects.id = project_milestones.project_id
      AND client_projects.user_id = auth.uid()
    )
  );

-- Create function to add default milestones to projects without them
CREATE OR REPLACE FUNCTION public.add_default_milestones_to_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_record RECORD;
    start_date DATE;
    expected_end_date DATE;
BEGIN
    -- Loop through all projects that don't have milestones
    FOR project_record IN 
        SELECT cp.* 
        FROM client_projects cp
        LEFT JOIN (
            SELECT project_id, COUNT(*) as milestone_count 
            FROM project_milestones 
            GROUP BY project_id
        ) pm ON cp.id = pm.project_id
        WHERE pm.milestone_count IS NULL OR pm.milestone_count = 0
    LOOP
        -- Default dates if project dates are null
        start_date := COALESCE(project_record.start_date::date, current_date);
        expected_end_date := COALESCE(project_record.expected_end_date::date, (current_date + project_record.estimated_completion_days * INTERVAL '1 day')::date);
        
        -- Create default milestones
        INSERT INTO project_milestones (project_id, title, description, due_date, is_completed)
        VALUES
            (project_record.id, 'Análisis inicial de requisitos', 'Revisión y análisis de necesidades', (start_date + 2 * INTERVAL '1 day')::timestamp, false),
            (project_record.id, 'Diseño y maquetación', 'Creación de diseños y estructura de la web', (start_date + 7 * INTERVAL '1 day')::timestamp, false),
            (project_record.id, 'Desarrollo de funcionalidades core', 'Implementación de las funcionalidades básicas', (start_date + (project_record.estimated_completion_days * 0.6) * INTERVAL '1 day')::timestamp, false),
            (project_record.id, 'Integración de servicios adicionales', 'Implementación de todos los módulos contratados', (start_date + (project_record.estimated_completion_days * 0.8) * INTERVAL '1 day')::timestamp, false),
            (project_record.id, 'Pruebas y ajustes finales', 'Revisión final y ajustes de la web', (expected_end_date - 2 * INTERVAL '1 day')::timestamp, false),
            (project_record.id, 'Entrega del proyecto', 'Entrega final del proyecto al cliente', expected_end_date::timestamp, false);
    END LOOP;
END;
$$;

-- Execute the function to add default milestones to existing projects
SELECT public.add_default_milestones_to_projects();

-- Improve the admin_get_cart_items function with better error handling
CREATE OR REPLACE FUNCTION public.admin_get_cart_items()
RETURNS TABLE(
    id uuid, 
    cart_id uuid, 
    item_id uuid, 
    item_type text, 
    quantity integer, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    user_id uuid, 
    item_name text, 
    item_price integer, 
    total_price integer, 
    first_name text, 
    last_name text, 
    business_name text, 
    email text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verificar si el usuario actual es un administrador
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador';
    END IF;
    
    -- Devolver los datos solo si el usuario es administrador
    RETURN QUERY
    SELECT 
        sci.id,
        sci.cart_id,
        sci.item_id,
        sci.item_type,
        sci.quantity,
        sci.created_at,
        sci.updated_at,
        sc.user_id,
        CASE 
            WHEN sci.item_type = 'pack' THEN mp.name
            WHEN sci.item_type = 'service' THEN ms.name
            ELSE 'Producto desconocido'
        END AS item_name,
        CASE 
            WHEN sci.item_type = 'pack' THEN COALESCE(mp.price, 0)
            WHEN sci.item_type = 'service' THEN COALESCE(ms.price, 0)
            ELSE 0
        END AS item_price,
        CASE 
            WHEN sci.item_type = 'pack' THEN (COALESCE(mp.price, 0) * sci.quantity)
            WHEN sci.item_type = 'service' THEN (COALESCE(ms.price, 0) * sci.quantity)
            ELSE 0
        END AS total_price,
        cp.first_name,
        cp.last_name,
        cp.business_name,
        au.email
    FROM 
        public.shopping_cart_items sci
    JOIN 
        public.shopping_cart sc ON sci.cart_id = sc.id
    LEFT JOIN 
        public.my_packs mp ON sci.item_type = 'pack' AND sci.item_id = mp.id
    LEFT JOIN 
        public.my_services ms ON sci.item_type = 'service' AND sci.item_id = ms.id
    LEFT JOIN 
        public.client_profiles cp ON sc.user_id = cp.user_id
    LEFT JOIN 
        auth.users au ON sc.user_id = au.id;
END;
$$;