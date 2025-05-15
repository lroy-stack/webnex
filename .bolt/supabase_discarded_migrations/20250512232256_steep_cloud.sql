-- Fix Contact Messages Policy
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" 
  ON public.contact_messages FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Create Shopping Cart for Anonymous Users
-- First, alter shopping_cart table to allow null user_id (for anonymous carts)
ALTER TABLE shopping_cart ALTER COLUMN user_id DROP NOT NULL;

-- Update shopping cart policies for anonymous users
DROP POLICY IF EXISTS "Users can create their own cart" ON public.shopping_cart;
CREATE POLICY "Users can create their own cart" 
  ON public.shopping_cart FOR INSERT 
  TO public 
  WITH CHECK (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow Viewing Shopping Cart for Anonymous Users
DROP POLICY IF EXISTS "Users can view their own cart" ON public.shopping_cart;
CREATE POLICY "Users can view their own cart" 
  ON public.shopping_cart FOR SELECT 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow Updating Shopping Cart for Anonymous Users
DROP POLICY IF EXISTS "Users can update their own cart" ON public.shopping_cart;
CREATE POLICY "Users can update their own cart" 
  ON public.shopping_cart FOR UPDATE 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow Deleting Shopping Cart for Anonymous Users
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.shopping_cart;
CREATE POLICY "Users can delete their own cart" 
  ON public.shopping_cart FOR DELETE 
  TO public 
  USING (
    -- Either the user is authenticated and matches the cart user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user is anonymous and the user_id is null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Shopping Cart Items Policies for Anonymous Users
DROP POLICY IF EXISTS "Users can create their own cart items" ON public.shopping_cart_items;
CREATE POLICY "Users can create their own cart items" 
  ON public.shopping_cart_items FOR INSERT 
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

-- Allow Viewing Shopping Cart Items for Anonymous Users
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.shopping_cart_items;
CREATE POLICY "Users can view their own cart items" 
  ON public.shopping_cart_items FOR SELECT 
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

-- Allow Updating Shopping Cart Items for Anonymous Users
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.shopping_cart_items;
CREATE POLICY "Users can update their own cart items" 
  ON public.shopping_cart_items FOR UPDATE 
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

-- Allow Deleting Shopping Cart Items for Anonymous Users
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.shopping_cart_items;
CREATE POLICY "Users can delete their own cart items" 
  ON public.shopping_cart_items FOR DELETE 
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

-- Create a public function to get user_id when needed (safer alternative to auth.jwt())
CREATE OR REPLACE FUNCTION public.get_cart_user_id() RETURNS uuid AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get authenticated user if available
  current_user_id := auth.uid();
  
  -- Return the user ID if authenticated, otherwise return NULL
  RETURN current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;