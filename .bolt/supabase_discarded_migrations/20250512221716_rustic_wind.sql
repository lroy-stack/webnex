/*
  # Fixed Cart Administration Solution

  1. Creates a view for admin cart access
  2. Implements proper RLS policies
  3. Preserves existing is_admin function

  This migration solves cart administration by creating a view that joins all
  necessary tables without requiring Edge Functions.
*/

-- Create admin cart items view for direct database access
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
  LEFT JOIN auth.users u ON sc.user_id = u.id;

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

-- Ensure shopping_cart has proper RLS policies
DROP POLICY IF EXISTS "Admins can view all carts" ON shopping_cart;
CREATE POLICY "Admins can view all carts" 
  ON shopping_cart FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Ensure shopping_cart_items has proper RLS policies
DROP POLICY IF EXISTS "Admins can view all cart items" ON shopping_cart_items;
CREATE POLICY "Admins can view all cart items" 
  ON shopping_cart_items FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Add indices for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id 
  ON shopping_cart(user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_cart_id 
  ON shopping_cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_item 
  ON shopping_cart_items(item_type, item_id);

-- Create index for user_roles to optimize admin role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_admin 
  ON user_roles(user_id) 
  WHERE role = 'admin';

-- Add tables to realtime publication if not already there
DO $$
DECLARE
  has_shopping_cart bool;
  has_shopping_cart_items bool;
BEGIN
  -- Check if tables are already in the publication
  SELECT EXISTS(
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'shopping_cart'
  ) INTO has_shopping_cart;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'shopping_cart_items'
  ) INTO has_shopping_cart_items;
  
  -- Add tables to publication if not already members
  IF NOT has_shopping_cart THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_cart;
  END IF;
  
  IF NOT has_shopping_cart_items THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_cart_items;
  END IF;
END $$;

-- Set replica identity for realtime tracking
ALTER TABLE IF EXISTS shopping_cart REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shopping_cart_items REPLICA IDENTITY FULL;

-- Set triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at_shopping_cart'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_updated_at_shopping_cart
      BEFORE UPDATE ON shopping_cart
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at_shopping_cart_items'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_updated_at_shopping_cart_items
      BEFORE UPDATE ON shopping_cart_items
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();';
  END IF;
END $$;