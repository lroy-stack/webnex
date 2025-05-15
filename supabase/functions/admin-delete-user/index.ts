import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token from the authorization header
    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the admin's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Get the admin user from their JWT token
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Error autenticando administrador', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user is an admin
    const { data: adminRoles, error: adminRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)

    if (adminRoleError) {
      return new Response(
        JSON.stringify({ error: 'Error verificando rol de administrador', details: adminRoleError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAdmin = adminRoles && adminRoles.some(role => role.role === 'admin')
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: Se requiere rol de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body to get the user ID to delete
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID de usuario requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a service role client to perform the deletion with elevated privileges
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // Get user info before deletion for logging
    const { data: userData, error: userDataError } = await adminClient.auth.admin.getUserById(userId)
    
    if (userDataError) {
      return new Response(
        JSON.stringify({ error: 'Error obteniendo datos del usuario', details: userDataError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. First, add entry to deleted_accounts
    const { error: deletedAccountError } = await adminClient
      .from('deleted_accounts')
      .insert({
        user_id: userId,
        email: userData.user.email,
        deleted_at: new Date().toISOString(),
        reason: 'Admin deletion',
        deleted_by: adminUser.id
      })

    if (deletedAccountError) {
      console.error("Error registering deleted account:", deletedAccountError)
      // Continue with deletion even if logging fails
    }

    // 2. Delete records from various tables (non-critical tables first)
    // We'll delete records in a specific sequence to handle foreign key constraints
    
    // Delete user modules
    await adminClient.from('user_modules').delete().eq('user_id', userId)

    // Delete user activity logs
    await adminClient.from('user_activity_logs').delete().eq('user_id', userId)

    // Delete client privacy settings
    await adminClient.from('client_privacy_settings').delete().eq('user_id', userId)
    
    // Delete client tax info
    await adminClient.from('client_tax_info').delete().eq('user_id', userId)
    
    // Delete client subscription
    await adminClient.from('client_subscriptions').delete().eq('user_id', userId)
    
    // Delete shopping cart items (requires getting cart IDs first)
    const { data: cartData } = await adminClient
      .from('shopping_cart')
      .select('id')
      .eq('user_id', userId)
    
    if (cartData && cartData.length > 0) {
      for (const cart of cartData) {
        await adminClient.from('shopping_cart_items').delete().eq('cart_id', cart.id)
      }
    }
    
    // Delete shopping cart
    await adminClient.from('shopping_cart').delete().eq('user_id', userId)
    
    // Delete order items (requires getting the order IDs first)
    const { data: orderData } = await adminClient
      .from('orders')
      .select('id')
      .eq('user_id', userId)
    
    if (orderData && orderData.length > 0) {
      for (const order of orderData) {
        await adminClient.from('order_items').delete().eq('order_id', order.id)
      }
    }
    
    // Delete orders
    await adminClient.from('orders').delete().eq('user_id', userId)
    
    // Delete project updates, milestones, and forms (requires getting project IDs first)
    const { data: projectData } = await adminClient
      .from('client_projects')
      .select('id')
      .eq('user_id', userId)
    
    if (projectData && projectData.length > 0) {
      for (const project of projectData) {
        await adminClient.from('project_updates').delete().eq('project_id', project.id)
        await adminClient.from('project_milestones').delete().eq('project_id', project.id)
        await adminClient.from('project_forms').delete().eq('project_id', project.id)
      }
    }
    
    // Delete client projects
    await adminClient.from('client_projects').delete().eq('user_id', userId)
    
    // Delete project questionnaire
    await adminClient.from('project_preliminary_questionnaire').delete().eq('user_id', userId)
    
    // Delete chat messages, ratings (requires getting conversation IDs first)
    const { data: conversationData } = await adminClient
      .from('chat_conversations')
      .select('id')
      .eq('client_id', userId)
    
    if (conversationData && conversationData.length > 0) {
      for (const conversation of conversationData) {
        await adminClient.from('chat_messages').delete().eq('conversation_id', conversation.id)
        await adminClient.from('chat_ratings').delete().eq('conversation_id', conversation.id)
      }
    }
    
    // Delete chat conversations
    await adminClient.from('chat_conversations').delete().eq('client_id', userId)
    
    // Delete client profile
    await adminClient.from('client_profiles').delete().eq('user_id', userId)
    
    // Delete user roles
    await adminClient.from('user_roles').delete().eq('user_id', userId)

    // Finally, delete the user from auth.users
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteUserError) {
      return new Response(
        JSON.stringify({ error: 'Error eliminando usuario de Auth', details: deleteUserError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log admin action
    await adminClient
      .from('admin_action_logs')
      .insert({
        admin_id: adminUser.id,
        action_type: 'user_deletion',
        description: `Eliminación de usuario: ${userData.user.email}`,
        entity_type: 'user',
        entity_id: userId
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuario ${userData.user.email} eliminado exitosamente`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error en admin-delete-user:', error)
    return new Response(
      JSON.stringify({ error: 'Error del servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})