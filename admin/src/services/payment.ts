// Pagamento da assinatura pela Lastlink.
// O acesso é liberado pelo webhook da Lastlink para o E-MAIL usado na compra,
// por isso o membro precisa pagar com o mesmo e-mail da conta do site.

export const PAYMENT_CONFIG = {
  provider: 'Lastlink',
  priceFormatted: import.meta.env.VITE_PLAN_PRICE || 'R$ 150,00 / mês',
  checkoutUrl: import.meta.env.VITE_LASTLINK_CHECKOUT_URL || 'https://lastlink.com/p/CB91A400B/checkout-payment/',
  // Onde o assinante gerencia/cancela a assinatura (área do comprador da Lastlink)
  manageUrl: import.meta.env.VITE_LASTLINK_MANAGE_URL || 'https://lastlink.com/app/login',
};

/** Vai para o checkout da Lastlink */
export const openCheckoutPage = () => {
  window.location.href = PAYMENT_CONFIG.checkoutUrl;
};

/** Abre a área do comprador na Lastlink (trocar cartão / cancelar) */
export const openManageSubscriptionPage = () => {
  window.open(PAYMENT_CONFIG.manageUrl, '_blank');
};
