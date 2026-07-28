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
 * Abre o Portal de Gestão de Assinatura Individual no Stripe
 */
export const openStripeCustomerPortalPage = () => {
  const url = STRIPE_WEB_CONFIG.portalUrl;
  window.open(url, '_blank');
};
