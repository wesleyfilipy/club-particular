import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function handleStripeWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe signature header', { status: 400 });
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    console.log(`Processing Stripe Event: ${event.type}`);

    switch (event.type) {
      // 1. Checkout Session Completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.client_reference_id;

        if (userId) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_name: 'Club Particular VIP (R$100/mês)',
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      // 2. Subscription Created or Updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status === 'active' ? 'active' : 'expired';

        await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            status: status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // 3. Subscription Deleted / Canceled
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // 4. Invoice Paid
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

      // 5. Invoice Payment Failed
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
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
