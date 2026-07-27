import { supabase } from './supabase';

export const STRIPE_WEB_CONFIG = {
  priceFormatted: 'R$ 100,00 / mês',
  priceAmount: 100.0,
  // Link de Checkout Oficial do Stripe para o Plano R$ 100/mês
  checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/test_clubparticular_vip_100brl',
  portalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/test_clubparticular_portal',
};

/**
 * Abre o Stripe Checkout oficial em uma nova aba com o e-mail preenchido
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
 * Abre o Portal de Gestão do Cliente no Stripe para cancelar ou alterar pagamento
 */
export const openStripeCustomerPortalPage = () => {
  window.open(STRIPE_WEB_CONFIG.portalUrl, '_blank');
};
