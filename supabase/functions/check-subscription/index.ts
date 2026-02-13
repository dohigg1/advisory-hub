import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Stripe product IDs to plan tiers
const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_TyRnJnxPjfNopj": "starter",
  "prod_TyRqwPBwtyh0Qu": "starter",       // annual
  "prod_TyRqUP7kRSC5ME": "professional",
  "prod_TyRqhx1x04QCjS": "professional",  // annual
  "prod_TyRqQ8VWrr7uiA": "firm",
  "prod_TyRqQyWgiPvAkO": "firm",           // annual
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Get org info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("org_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.org_id) {
      return new Response(JSON.stringify({ subscribed: false, plan_tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check org's current plan from database first
    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("plan_tier, stripe_customer_id, subscription_status, current_period_end")
      .eq("id", profile.org_id)
      .single();

    // If we have a stripe customer, verify with Stripe
    if (org?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const productId = sub.items.data[0]?.price?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || "free";
        const endDate = new Date(sub.current_period_end * 1000).toISOString();

        // Sync to database if needed
        if (org.plan_tier !== tier) {
          await supabaseAdmin
            .from("organisations")
            .update({ plan_tier: tier, subscription_status: "active", current_period_end: endDate })
            .eq("id", profile.org_id);
        }

        return new Response(JSON.stringify({
          subscribed: true,
          plan_tier: tier,
          subscription_end: endDate,
          subscription_status: "active",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If no stripe customer, check email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const productId = sub.items.data[0]?.price?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || "free";
        const endDate = new Date(sub.current_period_end * 1000).toISOString();

        // Update org with stripe info
        await supabaseAdmin
          .from("organisations")
          .update({
            plan_tier: tier,
            stripe_customer_id: customerId,
            subscription_id: sub.id,
            subscription_status: "active",
            current_period_end: endDate,
          })
          .eq("id", profile.org_id);

        return new Response(JSON.stringify({
          subscribed: true,
          plan_tier: tier,
          subscription_end: endDate,
          subscription_status: "active",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      subscribed: false,
      plan_tier: org?.plan_tier || "free",
      subscription_status: org?.subscription_status || "inactive",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
