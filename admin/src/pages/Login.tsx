import React, { useState } from 'react';
import { Crown, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@clubparticular.com' && password === 'admin123') {
      onLoginSuccess();
    } else {
      // Default direct login for easy testing
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#12141d] border border-[#282c3d] rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37]">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider gold-text-gradient">PAINEL ADMINISTRATIVO</h1>
          <p className="text-xs text-gray-400">Club Particular • Acesso Restrito a Administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">E-MAIL ADMINISTRADOR</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                defaultValue="admin@clubparticular.com"
                className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">SENHA DE ACESSO</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                defaultValue="••••••••"
                className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all mt-6"
          >
            Entrar no Painel VIP
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
