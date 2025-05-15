
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2'

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle preflight requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user session
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify if user is admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    
    // This endpoint handles both admin-initiated and client-initiated conversations
    if (req.method === 'POST') {
      const body = await req.json();
      const { clientId, adminId, title, category, projectId } = body;
      
      // Validate inputs - for admin-initiated conversations
      if (isAdmin) {
        if (!clientId) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create conversation
        const { data, error } = await supabaseClient
          .from('chat_conversations')
          .insert({
            client_id: clientId,
            admin_id: session.user.id,
            title: title || 'Nueva conversación',
            category: category || null,
            project_id: projectId === 'none' ? null : projectId || null,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } 
      // For client-initiated conversations
      else {
        // Create conversation (client is the current user)
        const { data, error } = await supabaseClient
          .from('chat_conversations')
          .insert({
            client_id: session.user.id,
            admin_id: adminId, // Can be null
            title: title || 'Nueva consulta',
            category: category || null,
            project_id: projectId === 'none' ? null : projectId || null,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Default response for unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error with conversations:', error);
    return new Response(JSON.stringify({ error: 'Error processing conversation' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
