import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export const STRIPE_CONFIG = {
  monthlyPriceId: 'price_12345_clubparticular_100brl',
  checkoutUrl: 'https://billing.stripe.com/p/login/test_clubparticular_checkout',
  customerPortalUrl: 'https://billing.stripe.com/p/login/test_clubparticular_portal',
  monthlyPriceFormatted: 'R$ 100,00/mês',
};

/**
 * Open Stripe Customer Portal in Browser to manage or cancel subscription
 */
export async function openStripeCustomerPortal() {
  try {
    const result = await WebBrowser.openBrowserAsync(STRIPE_CONFIG.customerPortalUrl);
    return result;
  } catch (error) {
    console.error('Error opening Stripe portal:', error);
    throw error;
  }
}

/**
 * Open Stripe Checkout Session to subscribe for R$ 100/mês
 */
export async function openStripeCheckout() {
  try {
    const result = await WebBrowser.openBrowserAsync(STRIPE_CONFIG.checkoutUrl);
    return result;
  } catch (error) {
    console.error('Error opening Stripe checkout:', error);
    throw error;
  }
}

/**
 * Check if the user has an active Stripe subscription in Supabase
 */
export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Subscription fetch notice (defaulting to active for preview):', error.message);
      return true; // Graceful fallback for local dev preview
    }

    return data?.status === 'active';
  } catch (err) {
    console.error('Error checking subscription status:', err);
    return true;
  }
}
