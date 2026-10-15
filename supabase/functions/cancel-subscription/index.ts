import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { supabaseAdmin as supabase, corsHeaders, jsonResponse, getAccess } from '../_shared/r2.ts';

const stripeSecret = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Cancela a assinatura do usuário LOGADO (identificado pelo JWT, nunca por e-mail enviado no body)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const access = await getAccess(req);
    if (!access) {
      return jsonResponse({ error: 'Sessão expirada ou token inválido (HTTP 401).' }, 401);
    }

    const { data: subscription } = await supabase
      .from('es_subscriptions')
      .select('*')
      .eq('user_id', access.userId)
      .maybeSingle();

    if (!subscription) {
      return jsonResponse({ error: 'Nenhuma assinatura encontrada para esta conta.' }, 404);
    }

    let stripeCanceled = false;
    if (subscription.stripe_subscription_id && stripeSecret) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        stripeCanceled = true;
      } catch (stripeErr: any) {
        console.warn('Alerta Stripe:', stripeErr.message);
      }
    }

    await supabase
      .from('es_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    return jsonResponse({
      success: true,
      stripeCanceled,
      message: 'Sua assinatura foi cancelada com sucesso no Stripe e no sistema. Nenhuma cobrança futura será realizada.',
    });
  } catch (err: any) {
    console.error('Erro no cancelamento:', err);
    return jsonResponse({ error: err.message || 'Erro interno ao cancelar assinatura.' }, 500);
  }
});
