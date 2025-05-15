/*
  # Simplified Cart Access for Admins
  
  1. Changes
    - Creates a simpler approach for admin access to cart items
    - Adds direct SELECT policies for administrators
    - Drops dependency on complex admin_get_cart_items function
    
  2. Security
    - Still enforces admin role check but with simpler SQL
    - Makes admin access intuitive with standard database queries
*/

-- Simple view that joins cart items with their details for admin access
CREATE OR REPLACE VIEW admin_cart_items_view AS
SELECT 
  sci.id,
  sci.cart_id,
  sci.item_id,
  sci.item_type,
  sci.quantity,
  COALESCE(
    CASE WHEN sci.item_type = 'pack' THEN p.name 
         WHEN sci.item_type = 'service' THEN s.name
         ELSE NULL
    END, 
    'Unknown Item'
  ) as item_name,
  COALESCE(
    CASE WHEN sci.item_type = 'pack' THEN p.price 
         WHEN sci.item_type = 'service' THEN s.price
         ELSE NULL
    END, 
    0
  ) as item_price,
  COALESCE(
    CASE WHEN sci.item_type = 'pack' THEN p.price 
         WHEN sci.item_type = 'service' THEN s.price
         ELSE NULL
    END, 
    0
  ) * sci.quantity AS total_price,
  sc.user_id,
  cp.business_name,
  cp.first_name,
  cp.last_name,
  u.email,
  sci.created_at
FROM 
  shopping_cart_items sci
  JOIN shopping_cart sc ON sci.cart_id = sc.id
  LEFT JOIN my_packs p ON sci.item_type = 'pack' AND sci.item_id = p.id
  LEFT JOIN my_services s ON sci.item_type = 'service' AND sci.item_id = s.id
  LEFT JOIN client_profiles cp ON sc.user_id = cp.user_id
  LEFT JOIN auth.users u ON sc.user_id = u.id
ORDER BY sci.created_at DESC;

-- Enable RLS on the view
ALTER VIEW admin_cart_items_view ENABLE ROW LEVEL SECURITY;

-- Add policy for admin access to the view
CREATE POLICY "Admin access to cart items view" 
  ON admin_cart_items_view
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Grant permissions
GRANT SELECT ON admin_cart_items_view TO authenticated;