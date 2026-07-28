import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export const STRIPE_CONFIG = {
  monthlyPriceId: 'price_1TyFw2Ayx4jZ2C2QeQsqRJWO',
  checkoutUrl: 'https://buy.stripe.com/eVq14m1C75mY4MPdN32Fa02',
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

    // 1. Check user profile for Admin or Founder privileges
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
      return true;
    }

    // 2. Check subscriptions table by user_id
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (data && data.status === 'active') {
      return true;
    }

    // 3. Fallback check by email if available
    if (profile?.email) {
      const { data: subByEmail } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', profile.email)
        .single();
      if (subByEmail && subByEmail.status === 'active') {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error checking subscription status:', err);
    return false;
  }
}
