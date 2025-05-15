import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for our request body
interface OnboardingData {
  profileInfo?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  businessInfo?: {
    business_name?: string;
    website?: string;
    industry?: string;
    company_size?: string;
  };
  projectNeeds?: {
    project_name?: string;
    project_description?: string;
    target_audience?: string;
    design_preferences?: string[];
    required_features?: string[];
    business_goals?: string;
    timeline?: string;
    budget_range?: string;
    inspiration_urls?: string;
    notes?: string;
  };
  currentStep?: number;
  isCompleted?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json() as OnboardingData;
    console.log("Received onboarding data:", JSON.stringify(requestData, null, 2));
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    console.log("Processing data for user:", user.id);

    // Save profile information if provided
    if (requestData.profileInfo) {
      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await userClient
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking profile:', profileCheckError);
        return new Response(
          JSON.stringify({ error: 'Error checking profile', details: profileCheckError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (existingProfile) {
        console.log("Updating existing profile");
        // Update existing profile
        const { error: updateError } = await userClient
          .from('client_profiles')
          .update({
            ...requestData.profileInfo,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          return new Response(
            JSON.stringify({ error: 'Error updating profile', details: updateError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        console.log("Creating new profile");
        // Create new profile
        // Business name is required, set a default if not provided
        const businessName = requestData.businessInfo?.business_name || 
                           `${requestData.profileInfo.first_name || ''} ${requestData.profileInfo.last_name || ''}`.trim() ||
                           "New Business";
        
        const { error: insertError } = await userClient
          .from('client_profiles')
          .insert({
            user_id: user.id,
            business_name: businessName,
            ...requestData.profileInfo,
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return new Response(
            JSON.stringify({ error: 'Error creating profile', details: insertError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      // If business info is provided, update business name in client_profiles
      if (requestData.businessInfo?.business_name) {
        console.log("Updating business name:", requestData.businessInfo.business_name);
        const { error: updateBusinessNameError } = await userClient
          .from('client_profiles')
          .update({
            business_name: requestData.businessInfo.business_name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateBusinessNameError) {
          console.error('Error updating business name:', updateBusinessNameError);
        }
      }
    }

    // Save project needs information if provided
    if (requestData.projectNeeds) {
      console.log("Processing project needs data");
      // Process the required_features and design_preferences arrays
      const requiredFeatures = Array.isArray(requestData.projectNeeds.required_features) 
        ? requestData.projectNeeds.required_features 
        : [];
        
      const designPreferences = Array.isArray(requestData.projectNeeds.design_preferences)
        ? { preferences: requestData.projectNeeds.design_preferences }
        : {};
        
      // Convert inspiration URLs to array if it's a string
      let inspirationUrls = [];
      if (requestData.projectNeeds.inspiration_urls) {
        if (typeof requestData.projectNeeds.inspiration_urls === 'string') {
          inspirationUrls = requestData.projectNeeds.inspiration_urls
            .split(/[\r\n]+/)
            .filter(url => url.trim() !== '')
            .map(url => url.trim());
        } else if (Array.isArray(requestData.projectNeeds.inspiration_urls)) {
          inspirationUrls = requestData.projectNeeds.inspiration_urls;
        }
      }

      // Check if preliminary questionnaire exists
      const { data: existingQuestionnaire, error: questionnaireCheckError } = await userClient
        .from('project_preliminary_questionnaire')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (questionnaireCheckError) {
        console.error('Error checking questionnaire:', questionnaireCheckError);
        return new Response(
          JSON.stringify({ error: 'Error checking questionnaire', details: questionnaireCheckError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (existingQuestionnaire) {
        console.log("Updating existing questionnaire");
        // Update existing questionnaire
        const { error: updateError } = await userClient
          .from('project_preliminary_questionnaire')
          .update({
            project_name: requestData.projectNeeds.project_name,
            project_description: requestData.projectNeeds.project_description,
            target_audience: requestData.projectNeeds.target_audience,
            design_preferences: designPreferences,
            required_features: requiredFeatures,
            business_goals: requestData.projectNeeds.business_goals,
            timeline: requestData.projectNeeds.timeline,
            budget_range: requestData.projectNeeds.budget_range,
            inspiration_urls: inspirationUrls,
            notes: requestData.projectNeeds.notes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating questionnaire:', updateError);
          return new Response(
            JSON.stringify({ error: 'Error updating questionnaire', details: updateError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        console.log("Creating new questionnaire");
        // Create new questionnaire
        const { error: insertError } = await userClient
          .from('project_preliminary_questionnaire')
          .insert({
            user_id: user.id,
            project_name: requestData.projectNeeds.project_name,
            project_description: requestData.projectNeeds.project_description,
            target_audience: requestData.projectNeeds.target_audience,
            design_preferences: designPreferences,
            required_features: requiredFeatures,
            business_goals: requestData.projectNeeds.business_goals,
            timeline: requestData.projectNeeds.timeline,
            budget_range: requestData.projectNeeds.budget_range,
            inspiration_urls: inspirationUrls,
            notes: requestData.projectNeeds.notes
          });

        if (insertError) {
          console.error('Error creating questionnaire:', insertError);
          return new Response(
            JSON.stringify({ error: 'Error creating questionnaire', details: insertError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    // Mark onboarding as completed if requested
    if (requestData.isCompleted) {
      console.log("Marking onboarding as completed");
      // Use the function to mark onboarding as completed
      const { error: completeError } = await userClient
        .rpc('complete_user_onboarding', {
          user_uuid: user.id
        });

      if (completeError) {
        console.error('Error completing onboarding:', completeError);
        return new Response(
          JSON.stringify({ error: 'Error completing onboarding', details: completeError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Onboarding information saved successfully',
        currentStep: requestData.currentStep
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});