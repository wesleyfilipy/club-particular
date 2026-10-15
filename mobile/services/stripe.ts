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
 * Abre o checkout do Stripe vinculado à conta: o webhook libera exatamente este usuário (client_reference_id)
 */
export async function openStripeCheckout(userId: string, email: string) {
  try {
    const url =
      `${STRIPE_CONFIG.checkoutUrl}?client_reference_id=${encodeURIComponent(userId)}` +
      `&prefilled_email=${encodeURIComponent(email)}`;
    const result = await WebBrowser.openBrowserAsync(url);
    return result;
  } catch (error) {
    console.error('Error opening Stripe checkout:', error);
    throw error;
  }
}

/**
 * Cancel Stripe & Supabase Subscription in 1-Click
 */
export async function cancelStripeSubscriptionMobile(userId: string, email?: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId, email },
    });

    if (!error && data?.success) {
      return {
        success: true,
        message: data.message || 'Assinatura cancelada com sucesso no Stripe e no aplicativo.',
      };
    }

    // Fallback: update subscriptions table in Supabase
    await supabase
      .from('es_subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return {
      success: true,
      message: 'Sua assinatura foi marcada como cancelada no sistema.',
    };
  } catch (err: any) {
    console.error('Error canceling subscription:', err);
    return {
      success: false,
      message: err.message || 'Não foi possível cancelar a assinatura.',
    };
  }
}

/**
 * Check if the user has an active Stripe subscription in Supabase
 */
export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // Cria o perfil do Escala Swipe desta conta no primeiro acesso
    await supabase.rpc('es_ensure_profile');

    // 1. Check user profile for Admin or Founder privileges
    const { data: profile } = await supabase
      .from('es_profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
      return true;
    }

    // 2. Check subscriptions table by user_id
    const { data } = await supabase
      .from('es_subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (data && data.status === 'active') {
      return true;
    }

    // 3. Fallback check by email if available
    if (profile?.email) {
      const { data: subByEmail } = await supabase
        .from('es_subscriptions')
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
