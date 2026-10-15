import React, { useState } from 'react';
import { Crown, CreditCard, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { openStripeCheckoutPage, STRIPE_WEB_CONFIG } from '../services/stripe';

interface PaywallProps {
  userId: string;
  userEmail: string;
  onRecheck: () => Promise<void>;
  onLogout: () => void;
}

/** Conta criada mas sem assinatura paga: o acesso só é liberado após o pagamento desta conta */
export const Paywall: React.FC<PaywallProps> = ({ userId, userEmail, onRecheck, onLogout }) => {
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    setNotFound(false);
    await onRecheck();
    setChecking(false);
    setNotFound(true);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-4">
      <div className="bg-[#12141d] border border-[#d4af37] rounded-3xl max-w-md w-full p-8 space-y-6 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center mx-auto text-[#f5d77f]">
          <Crown className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white">Ative sua assinatura</h1>
          <p className="text-xs text-gray-400">
            A conta <span className="font-mono text-gray-200">{userEmail}</span> ainda não tem uma assinatura paga.
            Cada conta precisa da sua própria assinatura para acessar o Escala Swipe.
          </p>
        </div>

        <button
          onClick={() => openStripeCheckoutPage(userEmail, userId)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard className="w-5 h-5" />
          Assinar agora ({STRIPE_WEB_CONFIG.priceFormatted})
        </button>

        <button
          onClick={handleRecheck}
          disabled={checking}
          className="w-full py-3 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-gray-200 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[#d4af37]" />}
          Já paguei — verificar novamente
        </button>

        {notFound && (
          <p className="text-[11px] text-gray-400">
            Pagamento ainda não confirmado. A confirmação do Stripe pode levar alguns segundos.
          </p>
        )}

        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Sair desta conta
        </button>
      </div>
    </div>
  );
};
