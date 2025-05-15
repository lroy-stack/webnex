/*
  # Remove Cart Edge Function Dependencies
  
  This migration removes dependencies on edge functions for cart administration
  by ensuring proper RLS policies and database views are in place.
  
  The edge function is no longer needed because we're using database views with
  appropriate RLS policies to control access.
*/

-- Drop the function if it still exists
DROP FUNCTION IF EXISTS admin_get_cart_items();

-- Confirm that proper policies exist for shopping_cart and shopping_cart_items tables
DO $$
BEGIN
  -- Ensure shopping_cart has proper RLS policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_cart' 
    AND policyname = 'Admins can view all carts'
  ) THEN
    CREATE POLICY "Admins can view all carts" 
      ON shopping_cart FOR SELECT 
      TO authenticated 
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;
  
  -- Ensure shopping_cart_items has proper RLS policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_cart_items' 
    AND policyname = 'Admins can view all cart items'
  ) THEN
    CREATE POLICY "Admins can view all cart items" 
      ON shopping_cart_items FOR SELECT 
      TO authenticated 
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;
END$$;

-- Ensure the view is properly defined
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE viewname = 'admin_cart_items_view'
  ) THEN
    EXECUTE $VIEW$
    CREATE VIEW admin_cart_items_view AS
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
    $VIEW$;
    
    ALTER VIEW admin_cart_items_view ENABLE ROW LEVEL SECURITY;
    
    EXECUTE $POLICY$
    CREATE POLICY "Admin access to cart items view" 
      ON admin_cart_items_view
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
    $POLICY$;
    
    GRANT SELECT ON admin_cart_items_view TO authenticated;
  END IF;
END$$;