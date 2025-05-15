
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "El ID de usuario es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get customer ID
    const { data: subscription } = await supabase
      .from("client_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    // If no customer ID, user has no subscription
    if (!subscription?.stripe_customer_id) {
      await supabase
        .from("client_subscriptions")
        .upsert({
          user_id: userId,
          subscription_status: "inactive",
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      return new Response(
        JSON.stringify({
          subscription_status: "inactive",
          subscription_tier: null,
          subscription_end_date: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check subscription status in Stripe
    const customerId = subscription.stripe_customer_id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // If no active subscriptions
    if (subscriptions.data.length === 0) {
      await supabase
        .from("client_subscriptions")
        .update({
          subscription_status: "inactive",
          subscription_tier: null,
          subscription_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          subscription_status: "inactive",
          subscription_tier: null,
          subscription_end_date: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // We have an active subscription
    const activeSubscription = subscriptions.data[0];
    const priceId = activeSubscription.items.data[0].price.id;
    
    // Get subscription tier from price ID - in real app you'd have a mapping table
    // This is just a placeholder logic
    let subscriptionTier = "premium"; // Default tier
    
    // Update subscription in our database
    await supabase
      .from("client_subscriptions")
      .update({
        subscription_status: "active",
        subscription_tier: subscriptionTier,
        stripe_subscription_id: activeSubscription.id,
        subscription_start_date: new Date(activeSubscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        subscription_status: "active",
        subscription_tier: subscriptionTier,
        subscription_start_date: new Date(activeSubscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(activeSubscription.current_period_end * 1000).toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
