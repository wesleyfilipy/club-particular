import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const stripeSecret = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
const endpointSecret = (Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim();
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Converte o status do Stripe para o status usado no Supabase
const mapStatus = (status: Stripe.Subscription.Status): string => {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'unpaid') return 'unpaid';
  if (status === 'canceled') return 'canceled';
  return 'expired';
};

/**
 * Descobre qual conta do Supabase pagou: primeiro pelo client_reference_id (ID do usuário enviado
 * no link de checkout), depois pelo e-mail usado no pagamento. Cada assinatura libera UMA conta.
 */
async function resolveUserId(clientReferenceId: string | null, email: string | null | undefined): Promise<string | null> {
  if (clientReferenceId && UUID_REGEX.test(clientReferenceId)) {
    const { data } = await supabase.from('es_profiles').select('id').eq('id', clientReferenceId).maybeSingle();
    if (data?.id) return data.id;

    // Pagou antes do primeiro login: cria o perfil a partir da conta do Supabase Auth
    const { data: authData } = await supabase.auth.admin.getUserById(clientReferenceId);
    const authUser = authData?.user;
    if (authUser?.email) {
      const { error } = await supabase.from('es_profiles').upsert(
        {
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (!error) return authUser.id;
    }
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (cleanEmail) {
    const { data } = await supabase.from('es_profiles').select('id').ilike('email', cleanEmail).maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

async function syncSubscription(userId: string, subscription: Stripe.Subscription) {
  await supabase.from('es_subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

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
    const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret, undefined, cryptoProvider);

    console.log(`Processing Stripe Event: ${event.type}`);

    switch (event.type) {
      // 1. Pagamento concluído no checkout: libera a conta que pagou
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription) break;

        const userId = await resolveUserId(
          session.client_reference_id,
          session.customer_details?.email || session.customer_email
        );

        if (!userId) {
          console.warn(`Pagamento sem conta correspondente no Supabase: ${session.customer_details?.email}`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(userId, subscription);
        break;
      }

      // 2. Assinatura criada / atualizada / cancelada
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: existing } = await supabase
          .from('es_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (existing?.user_id) {
          await syncSubscription(existing.user_id, subscription);
        }
        // Se ainda não existe, o checkout.session.completed cria o vínculo.
        break;
      }

      // 3. Renovação mensal paga
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

        const { data: existing } = await supabase
          .from('es_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (existing?.user_id) {
          await syncSubscription(existing.user_id, subscription);
        }
        break;
      }

      // 4. Falha no pagamento (cartão recusado / expirado)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        await supabase
          .from('es_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string);
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
