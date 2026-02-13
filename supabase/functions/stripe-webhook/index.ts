import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_TyRnJnxPjfNopj": "starter",
  "prod_TyRqwPBwtyh0Qu": "starter",
  "prod_TyRqUP7kRSC5ME": "professional",
  "prod_TyRqhx1x04QCjS": "professional",
  "prod_TyRqQ8VWrr7uiA": "firm",
  "prod_TyRqQyWgiPvAkO": "firm",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  
  let event: Stripe.Event;
  
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (orgId && subscriptionId) {
          // Get subscription details
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const productId = sub.items.data[0]?.price?.product as string;
          const tier = PRODUCT_TO_TIER[productId] || "free";

          await supabaseAdmin
            .from("organisations")
            .update({
              plan_tier: tier,
              stripe_customer_id: customerId,
              subscription_id: subscriptionId,
              subscription_status: "active",
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq("id", orgId);

          // Create subscription record
          await supabaseAdmin.from("subscriptions").upsert({
            org_id: orgId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            plan_tier: tier,
            price_id: sub.items.data[0]?.price?.id,
            interval: sub.items.data[0]?.price?.recurring?.interval || "month",
            status: "active",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }, { onConflict: "org_id" });

          // Audit log
          await supabaseAdmin.from("audit_log").insert({
            org_id: orgId,
            action: "plan_changed",
            target_type: "organisation",
            target_id: orgId,
            metadata_json: { new_tier: tier, subscription_id: subscriptionId },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const productId = sub.items.data[0]?.price?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || "free";
        const orgId = sub.metadata?.org_id;

        if (orgId) {
          await supabaseAdmin
            .from("organisations")
            .update({
              plan_tier: tier,
              subscription_status: sub.status,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq("id", orgId);

          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_tier: tier,
              status: sub.status,
              cancel_at_period_end: sub.cancel_at_period_end,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq("org_id", orgId);

          await supabaseAdmin.from("audit_log").insert({
            org_id: orgId,
            action: "plan_changed",
            target_type: "organisation",
            target_id: orgId,
            metadata_json: { new_tier: tier, status: sub.status },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;

        if (orgId) {
          await supabaseAdmin
            .from("organisations")
            .update({
              plan_tier: "free",
              subscription_status: "cancelled",
            })
            .eq("id", orgId);

          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("org_id", orgId);

          await supabaseAdmin.from("audit_log").insert({
            org_id: orgId,
            action: "plan_changed",
            target_type: "organisation",
            target_id: orgId,
            metadata_json: { new_tier: "free", reason: "subscription_cancelled" },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find org by stripe_customer_id
        const { data: org } = await supabaseAdmin
          .from("organisations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await supabaseAdmin.from("invoices").insert({
            org_id: org.id,
            stripe_invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            invoice_url: invoice.hosted_invoice_url,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: org } = await supabaseAdmin
          .from("organisations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await supabaseAdmin
            .from("organisations")
            .update({ subscription_status: "past_due" })
            .eq("id", org.id);

          await supabaseAdmin.from("invoices").insert({
            org_id: org.id,
            stripe_invoice_id: invoice.id,
            amount_paid: 0,
            currency: invoice.currency,
            status: "failed",
            invoice_url: invoice.hosted_invoice_url,
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
