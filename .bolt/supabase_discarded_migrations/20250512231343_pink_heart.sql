-- Create admin_cart_items_view for direct access by admin users
CREATE OR REPLACE VIEW admin_cart_items_view AS
SELECT 
  sci.id,
  sci.cart_id,
  sci.item_id,
  sci.item_type,
  sci.quantity,
  CASE 
    WHEN sci.item_type = 'pack' THEN p.name 
    WHEN sci.item_type = 'service' THEN s.name
    ELSE 'Unknown Item'
  END as item_name,
  CASE 
    WHEN sci.item_type = 'pack' THEN p.price 
    WHEN sci.item_type = 'service' THEN s.price
    ELSE 0
  END as item_price,
  CASE 
    WHEN sci.item_type = 'pack' THEN p.price * sci.quantity 
    WHEN sci.item_type = 'service' THEN s.price * sci.quantity
    ELSE 0
  END as total_price,
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
  LEFT JOIN auth.users u ON sc.user_id = u.id;

-- Create policies for the view
DROP POLICY IF EXISTS "Admins can view admin_cart_items_view" ON admin_cart_items_view;
CREATE POLICY "Admins can view admin_cart_items_view" 
  ON admin_cart_items_view FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- For contact_messages, create an anonymous insert policy
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
CREATE POLICY "Anyone can insert contact messages" 
  ON contact_messages FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Update shopping cart policies for anonymous users
ALTER TABLE shopping_cart ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can create their own cart" ON shopping_cart;
CREATE POLICY "Users can create their own cart" 
  ON shopping_cart FOR INSERT 
  TO public 
  WITH CHECK (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can view own cart" ON shopping_cart;
CREATE POLICY "Users can view their own cart" 
  ON shopping_cart FOR SELECT 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can update their own cart" ON shopping_cart;
CREATE POLICY "Users can update their own cart" 
  ON shopping_cart FOR UPDATE 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own cart" ON shopping_cart;
CREATE POLICY "Users can delete their own cart" 
  ON shopping_cart FOR DELETE 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Shopping Cart Items Policies for Anonymous Users
DROP POLICY IF EXISTS "Users can create their own cart items" ON shopping_cart_items;
CREATE POLICY "Users can create their own cart items" 
  ON shopping_cart_items FOR INSERT 
  TO public 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_cart sc 
      WHERE sc.id = shopping_cart_items.cart_id AND (
        -- Either the user is authenticated and matches the cart user_id
        (auth.uid() IS NOT NULL AND sc.user_id = auth.uid()) OR
        -- Or the user is anonymous and the user_id is null
        (auth.uid() IS NULL AND sc.user_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can view their own cart items" ON shopping_cart_items;
CREATE POLICY "Users can view their own cart items" 
  ON shopping_cart_items FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM shopping_cart sc 
      WHERE sc.id = shopping_cart_items.cart_id AND (
        -- Either the user is authenticated and matches the cart user_id
        (auth.uid() IS NOT NULL AND sc.user_id = auth.uid()) OR
        -- Or the user is anonymous and the user_id is null
        (auth.uid() IS NULL AND sc.user_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own cart items" ON shopping_cart_items;
CREATE POLICY "Users can update their own cart items" 
  ON shopping_cart_items FOR UPDATE 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM shopping_cart sc 
      WHERE sc.id = shopping_cart_items.cart_id AND (
        -- Either the user is authenticated and matches the cart user_id
        (auth.uid() IS NOT NULL AND sc.user_id = auth.uid()) OR
        -- Or the user is anonymous and the user_id is null
        (auth.uid() IS NULL AND sc.user_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their own cart items" ON shopping_cart_items;
CREATE POLICY "Users can delete their own cart items" 
  ON shopping_cart_items FOR DELETE 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM shopping_cart sc 
      WHERE sc.id = shopping_cart_items.cart_id AND (
        -- Either the user is authenticated and matches the cart user_id
        (auth.uid() IS NOT NULL AND sc.user_id = auth.uid()) OR
        -- Or the user is anonymous and the user_id is null
        (auth.uid() IS NULL AND sc.user_id IS NULL)
      )
    )
  );