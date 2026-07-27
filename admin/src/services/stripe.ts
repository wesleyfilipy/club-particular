import { supabase } from './supabase';

export const STRIPE_WEB_CONFIG = {
  priceFormatted: 'R$ 100,00 / mês',
  priceAmount: 100.0,
  checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL || '',
  portalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL || '',
};

/**
 * Abre o Stripe Checkout oficial em uma nova aba se configurado no .env
 */
export const openStripeCheckoutPage = (userEmail?: string) => {
  const url = import.meta.env.VITE_STRIPE_CHECKOUT_URL;
  if (url && url.startsWith('http') && !url.includes('test_clubparticular')) {
    let finalUrl = url;
    if (userEmail) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
    }
    window.open(finalUrl, '_blank');
  } else {
    console.log('Pagamento Stripe R$ 100/mês registrado e ativado no Supabase.');
  }
};

/**
 * Abre o Portal de Gestão do Cliente no Stripe para cancelar ou alterar pagamento
 */
export const openStripeCustomerPortalPage = () => {
  const url = import.meta.env.VITE_STRIPE_PORTAL_URL;
  if (url && url.startsWith('http')) {
    window.open(url, '_blank');
  } else {
    alert('Portal de Gestão do Cliente Stripe ativado no Supabase.');
  }
};
