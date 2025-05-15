-- This migration addresses issues with admin access to cart items
-- It ensures proper permissions and RLS exceptions for admin functions

-- Confirm user_roles and client_profiles permissions

-- Ensure users_with_email view is accessible
GRANT SELECT ON users_with_email TO authenticated;

-- Update shopping cart items RLS policies to include admin access
DROP POLICY IF EXISTS "Admins can view all cart items" ON public.shopping_cart_items;
CREATE POLICY "Admins can view all cart items" 
ON public.shopping_cart_items FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

-- Update shopping cart RLS policies to include admin access
DROP POLICY IF EXISTS "Admins can view all shopping carts" ON public.shopping_cart;
CREATE POLICY "Admins can view all shopping carts" 
ON public.shopping_cart FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

-- Drop any existing admin_get_cart_items function to ensure clean recreation
DROP FUNCTION IF EXISTS admin_get_cart_items();

-- Create the properly secured admin_get_cart_items function
CREATE OR REPLACE FUNCTION admin_get_cart_items()
RETURNS TABLE (
  id uuid,
  cart_id uuid,
  item_id uuid,
  item_type text,
  quantity integer,
  item_name text,
  item_price integer,
  total_price integer,
  user_id uuid,
  business_name text,
  first_name text,
  last_name text,
  email text,
  created_at timestamp with time zone
) 
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public -- Limit search_path to just public schema for security
LANGUAGE plpgsql AS $$
DECLARE
  requesting_user_id uuid;
  is_requesting_user_admin boolean;
BEGIN
  -- Get the ID of the user making the request
  requesting_user_id := auth.uid();
  
  -- Check if the requesting user exists
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if the requesting user is an admin
  SELECT is_admin(requesting_user_id) INTO is_requesting_user_admin;
  
  IF NOT is_requesting_user_admin THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador';
  END IF;

  RETURN QUERY
  WITH cart_items AS (
    SELECT 
      sci.id,
      sci.cart_id,
      sci.item_id,
      sci.item_type,
      sci.quantity,
      sci.created_at,
      sc.user_id
    FROM 
      shopping_cart_items sci
      JOIN shopping_cart sc ON sci.cart_id = sc.id
  ),
  item_details AS (
    SELECT 
      ci.*,
      -- Get item details based on item_type
      CASE 
        WHEN ci.item_type = 'pack' THEN (SELECT name FROM my_packs WHERE id = ci.item_id)
        WHEN ci.item_type = 'service' THEN (SELECT name FROM my_services WHERE id = ci.item_id)
        ELSE 'Unknown'
      END AS item_name,
      CASE 
        WHEN ci.item_type = 'pack' THEN (SELECT price FROM my_packs WHERE id = ci.item_id)
        WHEN ci.item_type = 'service' THEN (SELECT price FROM my_services WHERE id = ci.item_id)
        ELSE 0
      END AS item_price
    FROM cart_items ci
  ),
  profile_details AS (
    SELECT 
      id.*,
      -- Calculate total price
      id.item_price * id.quantity AS total_price,
      -- Get client profile details
      cp.business_name,
      cp.first_name,
      cp.last_name,
      e.email
    FROM 
      item_details id
      LEFT JOIN client_profiles cp ON id.user_id = cp.user_id
      LEFT JOIN users_with_email e ON id.user_id = e.id
  )
  SELECT * FROM profile_details
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_cart_items() TO authenticated;