/*
  # Enable Realtime for Chat Tables
  
  1. Changes
    - Enable realtime for chat_conversations table
    - Enable realtime for chat_messages table
  
  This migration extends our realtime setup to include the chat-related tables
  so we can provide real-time chat functionality to users.
*/

-- Function to check if a table is in the publication
CREATE OR REPLACE FUNCTION is_table_in_publication(publication_name text, table_name text) RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = publication_name 
    AND schemaname = 'public' 
    AND tablename = table_name
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for chat_conversations table
ALTER TABLE chat_conversations REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'chat_conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
  END IF;
END $$;

-- Enable realtime for chat_messages table
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- Enable realtime for shopping_cart_items table
ALTER TABLE shopping_cart_items REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'shopping_cart_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_cart_items;
  END IF;
END $$;

-- Drop the function when done
DROP FUNCTION is_table_in_publication;