import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This Edge Function creates project milestones, bypassing RLS policies
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { projectId, milestones } = await req.json();
    
    if (!projectId || !milestones || !Array.isArray(milestones)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Project ID and milestones array are required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get the authorization token for user validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create a client to validate the user
    const userClientUrl = Deno.env.get('SUPABASE_URL') || '';
    const userClientKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const userClient = createClient(userClientUrl, userClientKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError?.message }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await userClient
      .from('client_projects')
      .select('user_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Project fetch error:', projectError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify project ownership', details: projectError.message }),
        { 
          status: 403, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Check if user owns the project or is an admin
    const { data: userRoles } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
      
    const isAdmin = userRoles?.some(r => r.role === 'admin');
    
    if (project.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to add milestones to this project' }),
        { 
          status: 403, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create a service-role client to bypass RLS
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
    
    // Create the milestones
    const { data: createdMilestones, error: insertError } = await serviceClient
      .from('project_milestones')
      .insert(milestones)
      .select();
      
    if (insertError) {
      console.error('Error inserting milestones:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create milestones', details: insertError.message }),
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
        message: 'Milestones created successfully', 
        data: createdMilestones 
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