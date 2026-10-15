import { supabase } from './supabase';

export const STRIPE_WEB_CONFIG = {
  priceFormatted: 'R$ 0,01 / mês',
  priceAmount: 0.01,
  // Link oficial de checkout (Stripe Payment Link) do Escala Swipe
  checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/eVq14m1C75mY4MPdN32Fa02',
  portalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/test_clubparticular_portal',
};

/**
 * Monta o link de checkout do Stripe vinculado à conta do Supabase.
 * client_reference_id = ID do usuário: o webhook libera exatamente esta conta após o pagamento.
 */
export const getStripeCheckoutUrl = (userEmail: string, userId: string) => {
  const url = new URL(STRIPE_WEB_CONFIG.checkoutUrl);
  url.searchParams.set('prefilled_email', userEmail);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
};

export const openStripeCheckoutPage = (userEmail: string, userId: string) => {
  window.location.href = getStripeCheckoutUrl(userEmail, userId);
};

/**
 * Cancela a assinatura da conta logada (a Edge Function identifica o usuário pelo token)
 */
export const cancelStripeSubscriptionApi = async (): Promise<{ success: boolean; message: string }> => {
  const { data, error } = await supabase.functions.invoke('cancel-subscription', { body: {} });

  if (!error && data?.success) {
    return {
      success: true,
      message: data.message || 'Assinatura cancelada com sucesso.',
    };
  }

  return {
    success: false,
    message: data?.error || error?.message || 'Não foi possível cancelar a assinatura. Use o Portal Stripe.',
  };
};

/**
 * Abre o Portal de Gestão de Assinatura no Stripe
 */
export const openStripeCustomerPortalPage = (userEmail?: string) => {
  let url = STRIPE_WEB_CONFIG.portalUrl;
  if (userEmail) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
  }
  window.open(url, '_blank');
};
