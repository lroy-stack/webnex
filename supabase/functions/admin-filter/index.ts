import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of admin emails that should not appear as clients
const ADMIN_EMAILS = [
  'simpalori@gmail.com'
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse the request body
    const { action, email } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle different actions
    switch (action) {
      case 'check_email':
        // Check if email is in the admin list
        const isAdmin = ADMIN_EMAILS.includes(email?.toLowerCase());
        return new Response(
          JSON.stringify({ isAdmin }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'remove_client_data':
        // Validate that the email is in the admin list to prevent abuse
        if (!ADMIN_EMAILS.includes(email?.toLowerCase())) {
          return new Response(JSON.stringify({ error: 'Unauthorized email' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Get the user ID for this email
        const { data: userData, error: userError } = await adminClient.auth.admin
          .listUsers({ limit: 1, page: 1, filter: { email } });
        
        if (userError || !userData.users || userData.users.length === 0) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const userId = userData.users[0].id;
        
        // Start removing data, track which tables are modified
        const modified = [];
        
        // 1. Delete client_profiles
        const { error: profileError } = await adminClient
          .from('client_profiles')
          .delete()
          .eq('user_id', userId);
          
        if (!profileError) modified.push('client_profiles');
        
        // 2. Delete project_preliminary_questionnaire
        const { error: questionnaireError } = await adminClient
          .from('project_preliminary_questionnaire')
          .delete()
          .eq('user_id', userId);
          
        if (!questionnaireError) modified.push('project_preliminary_questionnaire');
        
        // 3. Delete client_privacy_settings
        const { error: privacyError } = await adminClient
          .from('client_privacy_settings')
          .delete()
          .eq('user_id', userId);
          
        if (!privacyError) modified.push('client_privacy_settings');
        
        // 4. Delete client_tax_info
        const { error: taxError } = await adminClient
          .from('client_tax_info')
          .delete()
          .eq('user_id', userId);
          
        if (!taxError) modified.push('client_tax_info');
        
        // 5. Delete user_modules
        const { error: modulesError } = await adminClient
          .from('user_modules')
          .delete()
          .eq('user_id', userId);
          
        if (!modulesError) modified.push('user_modules');
        
        // 6. Delete client_subscriptions
        const { error: subscriptionsError } = await adminClient
          .from('client_subscriptions')
          .delete()
          .eq('user_id', userId);
          
        if (!subscriptionsError) modified.push('client_subscriptions');
        
        // 7. Ensure admin role exists
        const { data: roleData, error: roleError } = await adminClient
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (!roleData && !roleError) {
          // Add admin role if it doesn't exist
          await adminClient
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin'
            });
          
          modified.push('user_roles_added');
        }
        
        // Return success with list of modified tables
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Client data removed successfully',
            modified
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in admin-filter function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});