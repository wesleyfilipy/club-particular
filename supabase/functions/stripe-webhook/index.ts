import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing Stripe Signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    console.log(`Processing Stripe Event: ${event.type}`);

    switch (event.type) {
      // 1. Checkout Session Completed (New Subscription Purchase)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const clientReferenceId = session.client_reference_id; // user_id

        if (clientReferenceId) {
          await supabase.from('subscriptions').upsert({
            user_id: clientReferenceId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_name: 'Club Particular VIP (R$100/mês)',
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      // 2. Subscription Created / Updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status === 'active' ? 'active' : 'expired';

        await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // 3. Subscription Canceled / Deleted
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // 4. Invoice Paid (Monthly Renewal Success)
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // 5. Invoice Payment Failed (Credit Card Declined / Expired)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`Stripe Webhook Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
