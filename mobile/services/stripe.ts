import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export const STRIPE_CONFIG = {
  monthlyPriceId: 'price_1TyFw2Ayx4jZ2C2QeQsqRJWO',
  checkoutUrl: 'https://billing.stripe.com/p/login/test_clubparticular_checkout',
  customerPortalUrl: 'https://billing.stripe.com/p/login/test_clubparticular_portal',
  monthlyPriceFormatted: 'R$ 0,01/mês',
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

    if (error || !data) {
      console.warn('Subscription fetch notice:', error?.message);
      return false;
    }

    return data.status === 'active';
  } catch (err) {
    console.error('Error checking subscription status:', err);
    return false;
  }
}
