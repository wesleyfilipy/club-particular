import React, { useState } from 'react';
import { CreditCard, LogOut, RefreshCw, Loader2, Lock } from 'lucide-react';
import { openCheckoutPage, PAYMENT_CONFIG } from '../services/payment';
import { Logo } from '../components/Logo';

interface PaywallProps {
  userEmail: string;
  onRecheck: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Conta sem assinatura ativa (nunca pagou ou não renovou): o login fica bloqueado
 * aqui até a Lastlink confirmar o pagamento do e-mail desta conta.
 */
export const Paywall: React.FC<PaywallProps> = ({ userEmail, onRecheck, onLogout }) => {
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
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 hero-glow">
      <div className="bg-[#0e0d0b] border border-white/10 rounded-xl max-w-md w-full p-8 space-y-6 text-center shadow-2xl">
        <Logo className="h-10 mx-auto" />
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f6e27a] via-[#d4af37] to-[#a8801f] flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5 text-black" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">Acesso bloqueado</h1>
          <p className="text-sm text-gray-300">
            A conta <span className="font-mono text-white">{userEmail}</span> não tem uma assinatura ativa.
            Se a assinatura não foi renovada, o acesso volta assim que o pagamento for confirmado.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 text-left">
          Na Lastlink, pague com o e-mail <strong className="text-white">{userEmail}</strong>. É por ele que liberamos o seu acesso.
        </div>

        <button
          onClick={openCheckoutPage}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold uppercase tracking-wide text-sm shadow-lg shadow-[#d4af37]/30 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard className="w-5 h-5" />
          Pagar assinatura ({PAYMENT_CONFIG.priceFormatted})
        </button>

        <button
          onClick={handleRecheck}
          disabled={checking}
          className="w-full py-3 rounded-full border border-white/15 text-gray-200 font-semibold text-xs hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[#e8c766]" />}
          Já paguei — verificar novamente
        </button>

        {notFound && (
          <p className="text-[11px] text-gray-400">
            Pagamento ainda não confirmado. A confirmação da Lastlink pode levar alguns minutos (Pix e boleto podem demorar mais).
          </p>
        )}

        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Sair desta conta
        </button>
      </div>
    </div>
  );
};
