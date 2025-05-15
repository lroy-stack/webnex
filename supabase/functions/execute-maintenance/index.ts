
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaintainenceTask {
  type: string;
  taskId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is an admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin', { user_uuid: user.id });
    
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { type, taskId } = await req.json() as MaintainenceTask;

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing task type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let taskResult: any;
    let executionHistoryId: string | null = null;

    // If a taskId is provided, record execution start
    if (taskId) {
      // Create execution history record
      const { data: executionData, error: executionError } = await supabaseClient
        .from('task_execution_history')
        .insert([
          { task_id: taskId, status: 'running' }
        ])
        .select('id')
        .single();

      if (executionError) {
        console.error("Error recording task execution start:", executionError);
      } else {
        executionHistoryId = executionData.id;
      }

      // Update task last_run_at
      await supabaseClient
        .from('scheduled_tasks')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', taskId);
    }

    // Execute the task based on its type
    try {
      switch (type) {
        case 'backup':
          // Simulate a database backup
          console.log(`Executing database backup at ${new Date().toISOString()}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
          taskResult = { message: "Backup completed successfully" };
          break;

        case 'cleanup':
          // Clean old logs (example: logs older than 30 days)
          console.log(`Cleaning old logs at ${new Date().toISOString()}`);
          
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data: deletedLogsData, error: deleteLogsError } = await supabaseClient
            .from('user_activity_logs')
            .delete()
            .lt('created_at', thirtyDaysAgo.toISOString())
            .select('count');
            
          if (deleteLogsError) {
            throw deleteLogsError;
          }
          
          taskResult = { 
            message: "Logs cleanup completed", 
            details: `Deleted ${deletedLogsData?.length || 0} old logs` 
          };
          break;

        case 'report':
          // Generate system report
          console.log(`Generating system report at ${new Date().toISOString()}`);
          
          // Get counts from various tables for the report
          const { data: stats, error: statsError } = await supabaseClient.rpc('get_system_stats');
          
          if (statsError) {
            throw statsError;
          }
          
          taskResult = { 
            message: "Report generated successfully", 
            stats 
          };
          break;
          
        case 'Limpieza de datos temporales':
        case 'Verificación de integridad':
        case 'Optimización de base de datos':
          // These are manual tasks from the UI
          console.log(`Executing ${type} at ${new Date().toISOString()}`);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work
          taskResult = { message: `${type} completed successfully` };
          break;

        default:
          taskResult = { message: `Unknown task type: ${type}` };
          break;
      }
      
      // Log admin action
      await supabaseClient
        .from('admin_action_logs')
        .insert([
          {
            action_type: 'maintenance',
            description: `Tarea de mantenimiento ejecutada: ${type}`,
            admin_id: user.id,
            entity_type: 'maintenance_task',
            entity_id: taskId
          }
        ]);

      // Update execution record if we have one
      if (executionHistoryId) {
        await supabaseClient
          .from('task_execution_history')
          .update({
            completed_at: new Date().toISOString(),
            status: 'success',
            result: 'Task completed successfully',
            details: taskResult
          })
          .eq('id', executionHistoryId);
      }

      return new Response(
        JSON.stringify({ success: true, result: taskResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error(`Error executing ${type} task:`, error);
      
      // Update execution record with failure
      if (executionHistoryId) {
        await supabaseClient
          .from('task_execution_history')
          .update({
            completed_at: new Date().toISOString(),
            status: 'failed',
            result: error instanceof Error ? error.message : 'Unknown error',
            details: { error: JSON.stringify(error) }
          })
          .eq('id', executionHistoryId);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in maintenance function:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
