
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
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { priceId, userId, customerEmail } = await req.json();

    if (!priceId || !userId || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Faltan datos requeridos" }),
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

    // Check if customer already exists
    const { data: existingCustomers } = await supabase
      .from("client_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existingCustomers?.stripe_customer_id;

    // If not, create a new customer in Stripe
    if (!customerId) {
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("business_name")
        .eq("user_id", userId)
        .single();

      const customerData: Stripe.CustomerCreateParams = {
        email: customerEmail,
        metadata: {
          user_id: userId,
        },
      };

      if (profile?.business_name) {
        customerData.name = profile.business_name;
      }

      const customer = await stripe.customers.create(customerData);
      customerId = customer.id;

      // Store the Stripe customer ID in our database
      await supabase.from("client_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${APP_URL}/app?checkout=success`,
      cancel_url: `${APP_URL}/app?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      locale: "es",
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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
