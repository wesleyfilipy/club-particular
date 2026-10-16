import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin as supabase } from '../_shared/r2.ts';

// A Lastlink não assina os webhooks: a URL cadastrada lá leva um token secreto
// (?token=...) que precisa ser igual ao secret LASTLINK_WEBHOOK_TOKEN.
const webhookToken = (Deno.env.get('LASTLINK_WEBHOOK_TOKEN') || '').trim();

// Período pago + folga para a renovação chegar. Se a Lastlink não avisar a renovação,
// o acesso fecha sozinho quando esse prazo acabar.
const ACCESS_DAYS = 33;

const GRANT_EVENTS = new Set(['purchase_order_confirmed', 'recurrent_payment', 'product_access_started']);
const REVOKE_EVENTS = new Set(['subscription_expired', 'product_access_ended']);
const REFUND_EVENTS = new Set(['payment_refund', 'payment_chargeback']);
const CANCEL_EVENTS = new Set(['subscription_canceled']);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const token = new URL(req.url).searchParams.get('token') || '';
  if (!webhookToken || token !== webhookToken) {
    return json({ error: 'Token inválido.' }, 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const eventId = String(payload?.Id || '');
  const eventName = String(payload?.Event || '');
  const event = eventName.toLowerCase();
  const isTest = payload?.IsTest === true;
  const data = payload?.Data || {};
  const email = String(data?.Buyer?.Email || data?.Member?.Email || '').trim().toLowerCase();
  const eventAt = payload?.CreatedAt ? new Date(payload.CreatedAt.endsWith('Z') ? payload.CreatedAt : `${payload.CreatedAt}Z`) : new Date();

  // Registra o evento; se o mesmo Id já chegou antes, não processa de novo
  if (eventId) {
    const { error: logError } = await supabase.from('es_payment_events').insert({
      id: eventId,
      event: eventName,
      email: email || null,
      is_test: isTest,
      payload,
    });
    if (logError?.code === '23505') {
      return json({ received: true, duplicate: true });
    }
  }

  // Eventos de teste do painel da Lastlink só confirmam que a URL funciona
  if (isTest) {
    return json({ received: true, test: true });
  }

  // Acesso via Subscription_Product_Access traz Data.Action = Add | Remove
  const action = String(data?.Action || '').toLowerCase();
  const grants = GRANT_EVENTS.has(event) || (event.startsWith('subscription_product_ac') && action === 'add');
  const revokes = REVOKE_EVENTS.has(event) || (event.startsWith('subscription_product_ac') && action === 'remove');
  const refunds = REFUND_EVENTS.has(event);
  const cancels = CANCEL_EVENTS.has(event);

  if (!email || !(grants || revokes || refunds || cancels)) {
    return json({ received: true, ignored: true });
  }

  const { data: existing } = await supabase
    .from('es_subscriptions')
    .select('id, user_id, status, current_period_end, last_event_at')
    .eq('email', email)
    .maybeSingle();

  // Ignora eventos fora de ordem (mais antigos que o último aplicado)
  if (existing?.last_event_at && new Date(existing.last_event_at) > eventAt) {
    return json({ received: true, outdated: true });
  }

  const { data: profile } = await supabase.from('es_profiles').select('id').eq('email', email).maybeSingle();

  const purchase = data?.Purchase || {};
  const subscriptionId = data?.Subscriptions?.[0]?.Id || data?.SubscriptionId || null;

  const row: Record<string, unknown> = {
    email,
    // Assinatura já vinculada a uma conta continua com ela (não migra para outra conta com o mesmo e-mail)
    user_id: existing?.user_id || profile?.id || null,
    provider: 'lastlink',
    external_subscription_id: subscriptionId,
    last_event: eventName,
    last_event_at: eventAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (grants) {
    const paidAt = purchase?.PaymentDate ? new Date(purchase.PaymentDate) : eventAt;
    row.status = 'active';
    row.current_period_start = paidAt.toISOString();
    row.current_period_end = addDays(paidAt, ACCESS_DAYS).toISOString();
    row.cancel_at_period_end = false;
    if (purchase?.Price?.Value) row.price_amount = purchase.Price.Value;
  } else if (revokes) {
    row.status = 'expired';
    row.current_period_end = new Date().toISOString();
  } else if (refunds) {
    row.status = 'canceled';
    row.current_period_end = new Date().toISOString();
  } else if (cancels) {
    // Cancelou a renovação: continua com acesso até o fim do período já pago
    if (!existing) return json({ received: true, ignored: true });
    row.status = existing.status;
    row.cancel_at_period_end = true;
  }

  const { error } = await supabase.from('es_subscriptions').upsert(row, { onConflict: 'email' });
  if (error) {
    console.error('Erro ao salvar assinatura:', error.message);
    // Remove o registro para a Lastlink poder reenviar este evento
    if (eventId) await supabase.from('es_payment_events').delete().eq('id', eventId);
    return json({ error: error.message }, 500);
  }

  return json({ received: true, email, status: row.status });
});
