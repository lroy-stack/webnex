import { supabase } from "@/integrations/supabase/client";

// List of admin emails that should not appear as clients
const ADMIN_EMAILS = [
  'simpalori@gmail.com'
];

/**
 * Checks if an email is an admin email that should be protected
 */
export const isProtectedAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Checks if the current user is a protected admin
 */
export const isCurrentUserProtectedAdmin = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userEmail = data.session?.user?.email;
    
    return userEmail ? isProtectedAdminEmail(userEmail) : false;
  } catch (error) {
    console.error("Error checking if current user is protected admin:", error);
    return false;
  }
};

/**
 * Removes client data for a protected admin to ensure they don't appear in client-related tables
 * This function is optimized to only run when necessary
 */
export const removeProtectedAdminClientData = async (email?: string): Promise<boolean> => {
  try {
    console.time('admin-data-cleanup');
    // If no email provided, try to get it from the current session
    if (!email) {
      const { data } = await supabase.auth.getSession();
      email = data.session?.user?.email;
      
      if (!email) return false;
    }
    
    // Verify it's a protected admin email
    if (!isProtectedAdminEmail(email)) {
      console.warn("Attempted to remove client data for non-admin email:", email);
      return false;
    }
    
    // Check if cleanup is needed by checking for client profile
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .maybeSingle();
      
    // Skip cleanup if no client profile exists
    if (!existingProfile) {
      console.log("No client profile found for admin, skipping cleanup");
      console.timeEnd('admin-data-cleanup');
      return true;
    }
    
    console.log("Client data found, proceeding with cleanup");
    console.time('admin-filter-call');
    // Call our admin-filter function endpoint
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-filter`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ // Send only the necessary data
          action: 'remove_client_data',
          email
        }),
      }
    );
    
    console.timeEnd('admin-filter-call');
    const result = await response.json();
    
    // Check for errors in the response
    if (result.error) {
      console.error("Error removing client data for admin:", result.error);
      console.timeEnd('admin-data-cleanup');
      return false;
    }
    
    console.log("Successfully removed client data for admin:", result);
    console.timeEnd('admin-data-cleanup');
    return true;
  } catch (error) {
    console.error("Error removing client data for admin:", error);
    console.timeEnd('admin-data-cleanup');
    return false;
  }
};

/**
 * Updates user role to 'admin' for protected admin emails
 * Optimized to check if the role already exists before updating
 */
export const ensureAdminRole = async (): Promise<boolean> => {
  try {
    console.log("Ensuring admin role");
    console.time('ensure-admin-role');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isProtectedAdminEmail(user.email || '')) {
      console.timeEnd('ensure-admin-role');
      return false;
    }
    
    // Check if user already has admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('id')  // Only select ID for faster queries
      .eq('user_id', user.id)
      .eq('role', 'admin');
    
    // If user doesn't have admin role, add it
    if (!userRoles || userRoles.length === 0) {
      console.log("Adding admin role to user");
      console.time('add-admin-role');
      const { error } = await supabase
        .from('user_roles')
        .insert([
          { user_id: user.id, role: 'admin' }
        ]);
      console.timeEnd('add-admin-role');
      
      if (error) {
        console.error("Error adding admin role:", error);
        console.timeEnd('ensure-admin-role');
        return false;
      }
      
      console.log("Added admin role for user:", user.email);
    } else {
      console.log("User already has admin role, skipping insertion");
    }
    
    console.timeEnd('ensure-admin-role');
    return true;
  } catch (error) {
    console.error("Error ensuring admin role:", error);
    console.timeEnd('ensure-admin-role');
    return false;
  }
};