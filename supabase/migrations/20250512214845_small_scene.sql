/*
  # Fix Admin Cart Items Function

  1. New Function
    - Completely rewrites the admin_get_cart_items function with a simpler approach
    - Uses standard SQL joins instead of complex nested queries
    - Returns all necessary data for cart item display
    
  2. Security
    - Uses SECURITY DEFINER to bypass RLS policies
    - Still enforces admin role check inside the function
    - Limits search_path for security
    
  3. Permissions
    - Grants execute permission to authenticated users
*/

-- Drop existing function if any
DROP FUNCTION IF EXISTS admin_get_cart_items();

-- Create new simplified function with flat joins instead of nested queries
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
  email varchar(255),
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public, auth
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
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = requesting_user_id AND role = 'admin'
  ) INTO is_requesting_user_admin;
  
  IF NOT is_requesting_user_admin THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador';
  END IF;

  -- Simple flat query with joins
  RETURN QUERY
  SELECT 
    sci.id,
    sci.cart_id,
    sci.item_id,
    sci.item_type,
    sci.quantity,
    COALESCE(p.name, s.name, 'Unknown Item') as item_name,
    COALESCE(p.price, s.price, 0) as item_price,
    COALESCE(p.price, s.price, 0) * sci.quantity AS total_price,
    sc.user_id,
    cp.business_name,
    cp.first_name,
    cp.last_name,
    u.email,
    sci.created_at
  FROM 
    shopping_cart_items sci
    INNER JOIN shopping_cart sc ON sci.cart_id = sc.id
    LEFT JOIN my_packs p ON sci.item_type = 'pack' AND sci.item_id = p.id
    LEFT JOIN my_services s ON sci.item_type = 'service' AND sci.item_id = s.id
    LEFT JOIN client_profiles cp ON sc.user_id = cp.user_id
    LEFT JOIN auth.users u ON sc.user_id = u.id
  ORDER BY sci.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_cart_items() TO authenticated;

-- Ensure shopping cart items has appropriate RLS policies for admins
DROP POLICY IF EXISTS "Admins can view all cart items" ON shopping_cart_items;
CREATE POLICY "Admins can view all cart items" 
  ON shopping_cart_items FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Ensure shopping cart has appropriate RLS policies for admins
DROP POLICY IF EXISTS "Admins can view all shopping carts" ON shopping_cart;
CREATE POLICY "Admins can view all shopping carts" 
  ON shopping_cart FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));