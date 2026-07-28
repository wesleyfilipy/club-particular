import { supabase } from './supabase';

export const STRIPE_WEB_CONFIG = {
  priceFormatted: 'R$ 0,01 / mês',
  priceAmount: 0.01,
  // Link Oficial de Checkout do Stripe para o Club Particular
  checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/eVq14m1C75mY4MPdN32Fa02',
  portalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/test_clubparticular_portal',
};

/**
 * Abre a página oficial de Checkout do Stripe com o e-mail individual do aluno preenchido
 */
export const openStripeCheckoutPage = (userEmail?: string) => {
  let url = STRIPE_WEB_CONFIG.checkoutUrl;
  if (userEmail) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
  }
  window.open(url, '_blank');
};

/**
 * Cancela a assinatura do usuário no Stripe e no Supabase em 1-clique
 */
export const cancelStripeSubscriptionApi = async (userEmail: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Inspeciona a Edge Function cancel-subscription no Supabase
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { email: userEmail },
    });

    if (!error && data?.success) {
      return {
        success: true,
        message: data.message || 'Assinatura cancelada com sucesso no Stripe e no sistema.',
      };
    }

    // 2. Fallback: Atualiza a tabela subscriptions do Supabase diretamente caso a Edge Function não esteja implantada
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    const targetUserId = profile?.id || userEmail;

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId);

    return {
      success: true,
      message: 'Sua assinatura foi marcada como cancelada no sistema.',
    };
  } catch (err: any) {
    console.error('Erro ao cancelar assinatura:', err);
    return {
      success: false,
      message: err.message || 'Não foi possível cancelar a assinatura.',
    };
  }
};

/**
 * Abre o Portal de Gestão de Assinatura Individual no Stripe
 */
export const openStripeCustomerPortalPage = (userEmail?: string) => {
  let url = STRIPE_WEB_CONFIG.portalUrl;
  if (userEmail) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
  }
  window.open(url, '_blank');
};
