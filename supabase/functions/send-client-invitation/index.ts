// supabase/functions/send-client-invitation/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2.38.0'
import { format } from 'npm:date-fns@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationData {
  email: string;
  firstName?: string;
  lastName?: string;
  businessName: string;
  token: string;
  expiresAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    })
  }
  
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse the request body
    const invitationData: InvitationData = await req.json()
    
    // Validate required fields
    if (!invitationData.email || !invitationData.businessName || !invitationData.token) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with the admin's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Create a client with the admin's token for validation
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the admin user from their JWT token
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !adminUser) {
      return new Response(JSON.stringify({ error: 'Error autenticando administrador', details: userError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      
    if (rolesError) {
      return new Response(JSON.stringify({ error: 'Error verificando rol', details: rolesError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create a service role client for sending emails
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Format the expiration date
    const expirationDate = format(
      new Date(invitationData.expiresAt),
      'MMMM d, yyyy'
    )

    // Get the app URL for the invitation link
    const appUrl = Deno.env.get('APP_URL') || 'https://webnex.es'
    const invitationLink = `${appUrl}/auth?token=${invitationData.token}&email=${encodeURIComponent(invitationData.email)}`

    // Construct email content
    const clientName = invitationData.firstName && invitationData.lastName 
      ? `${invitationData.firstName} ${invitationData.lastName}` 
      : invitationData.firstName || invitationData.businessName
    
    const emailSubject = `Invitación a WebNex para ${invitationData.businessName}`
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://ik.imagekit.io/insomnialz/webnex-logo.png?updatedAt=1746819797684" alt="WebNex Logo" style="max-width: 150px;">
        </div>
        
        <h2 style="color: #0d5bff; text-align: center;">¡Te han invitado a WebNex!</h2>
        
        <p>Hola ${clientName},</p>
        
        <p>Has sido invitado a unirte a WebNex como cliente para gestionar tu proyecto web para <strong>${invitationData.businessName}</strong>.</p>
        
        <p>Para aceptar la invitación y configurar tu cuenta, simplemente haz clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${invitationLink}" style="background-color: #0d5bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Aceptar invitación</a>
        </div>
        
        <p>Esta invitación es válida hasta el ${expirationDate}.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>Si no esperabas esta invitación, puedes ignorar este correo electrónico.</p>
          <p>Para obtener ayuda, contáctanos en <a href="mailto:soporte@webnex.es">soporte@webnex.es</a>.</p>
          <p>&copy; ${new Date().getFullYear()} WebNex. Todos los derechos reservados.</p>
        </div>
      </div>
    `

    // Send the invitation email
    const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(invitationData.email, {
      data: {
        invitation_token: invitationData.token,
        business_name: invitationData.businessName,
        first_name: invitationData.firstName,
        last_name: invitationData.lastName
      },
      subject: emailSubject,
      emailTemplate: emailContent,
    })

    if (emailError) {
      console.error("Error sending invitation email:", emailError)
      return new Response(JSON.stringify({ error: 'Error sending invitation email', details: emailError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Log successful invitation
    const { error: logError } = await adminClient
      .from('admin_action_logs')
      .insert({
        admin_id: adminUser.id,
        action_type: 'send_invitation',
        description: `Invitation sent to ${invitationData.email} for ${invitationData.businessName}`,
        entity_type: 'user_invitations'
      })

    if (logError) {
      console.error("Error logging invitation:", logError)
      // Non-critical error, continue
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent successfully to ${invitationData.email}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in send-client-invitation function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})