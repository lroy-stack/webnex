import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This Edge Function creates project updates, bypassing RLS policies
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { projectId, title, content, adminId } = await req.json();
    
    if (!projectId || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Project ID, title, and content are required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get the authorization token for user validation (if needed)
    const authHeader = req.headers.get('Authorization');

    // Create service-role client to bypass RLS (doesn't require auth)
    const serviceUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!serviceUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const serviceClient = createClient(serviceUrl, serviceKey);
    
    // Create the project update
    const { data: createdUpdate, error: insertError } = await serviceClient
      .from('project_updates')
      .insert({
        project_id: projectId,
        title,
        content,
        admin_id: adminId || "00000000-0000-0000-0000-000000000000", // Default system ID
        is_read: false
      })
      .select();
      
    if (insertError) {
      console.error('Error inserting project update:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create project update', details: insertError.message }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Project update created successfully', 
        data: createdUpdate 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});