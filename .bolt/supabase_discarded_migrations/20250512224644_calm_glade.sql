/*
  # Fix Contact Messages Policies

  1. Changes
     - Permite que usuarios anónimos inserten mensajes de contacto
     - Configura políticas para que usuarios autenticados vean sus propios mensajes
     - Permite a los administradores ver y gestionar todos los mensajes
*/

-- Enable RLS on contact_messages if not already enabled
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can view their own contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update all contact messages" ON public.contact_messages;

-- Create policy for ANYONE to insert contact messages (this es lo más importante - permite a usuarios no autenticados)
CREATE POLICY "Anyone can insert contact messages" 
  ON public.contact_messages 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Create policy for authenticated users to view their own contact messages
CREATE POLICY "Authenticated users can view their own contact messages" 
  ON public.contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for admins to view all contact messages
CREATE POLICY "Admins can view all contact messages" 
  ON public.contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for admins to update contact messages
CREATE POLICY "Admins can update all contact messages" 
  ON public.contact_messages 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );