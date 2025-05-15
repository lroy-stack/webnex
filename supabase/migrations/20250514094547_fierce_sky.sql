/*
  # Fix Shopping Cart Items Relationships
  
  This migration addresses cart functionality by:
  1. Ensuring proper RLS policies exist for cart operations
  2. Creating views needed for admin access to cart data
*/

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

-- Create admin_cart_items_view for simplified admin access
CREATE OR REPLACE VIEW admin_cart_items_view AS
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
  LEFT JOIN users_with_email u ON sc.user_id = u.id
ORDER BY sci.created_at DESC;

-- Grant access to the view for authenticated users
GRANT SELECT ON admin_cart_items_view TO authenticated;