/*
  # Add Policies for Contact Messages Table
  
  1. New Policies
    - Create policy for anonymous users to insert contact messages
    - Create policy for authenticated users to view their own messages
    - Create policy for admins to view and update all contact messages
    
  This migration ensures that contact form submissions work for both
  authenticated and non-authenticated users.
*/

-- Make sure RLS is enabled on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean migration
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can view their own contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update all contact messages" ON public.contact_messages;

-- Allow anyone (including anonymous users) to insert contact messages
CREATE POLICY "Anyone can insert contact messages" 
  ON public.contact_messages 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Allow authenticated users to view only their own messages
CREATE POLICY "Authenticated users can view their own contact messages" 
  ON public.contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Allow admins to view all contact messages
CREATE POLICY "Admins can view all contact messages" 
  ON public.contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all contact messages (for status changes, etc.)
CREATE POLICY "Admins can update all contact messages" 
  ON public.contact_messages 
  FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'::app_role));