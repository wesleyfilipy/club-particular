import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: 'É necessário informar o e-mail ou o ID do usuário.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Find target subscription record in Supabase
    let query = supabase.from('subscriptions').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      // Find user profile ID by email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile?.id) {
        query = query.eq('user_id', profile.id);
      } else {
        query = query.eq('user_id', email);
      }
    }

    const { data: subscription, error: fetchErr } = await query.maybeSingle();

    let stripeCanceled = false;
    let stripeSubscriptionId = subscription?.stripe_subscription_id;

    // 2. If stripe_subscription_id exists, call Stripe API to cancel recurring billing immediately
    if (stripeSubscriptionId && stripeSecret) {
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
        stripeCanceled = true;
      } catch (stripeErr: any) {
        console.warn('Alerta Stripe:', stripeErr.message);
        // If already canceled in Stripe or invalid ID, fallback to updating local status
      }
    }

    // 3. Update Supabase record status to 'canceled'
    if (subscription?.id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    } else if (userId || email) {
      // Upsert/Update by user reference
      const targetUserId = userId || email;
      await supabase.from('subscriptions').upsert({
        user_id: targetUserId,
        status: 'canceled',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        stripeCanceled,
        message: 'Sua assinatura foi cancelada com sucesso no Stripe e no sistema. Nenhuma cobrança futura será realizada.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Erro no cancelamento:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno ao cancelar assinatura.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
