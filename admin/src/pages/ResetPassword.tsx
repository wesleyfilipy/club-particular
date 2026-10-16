import React, { useState } from 'react';
import { Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Logo } from '../components/Logo';

interface ResetPasswordProps {
  onDone: () => void;
}

/** Aberta pelo link "redefinir senha" do e-mail: a pessoa escolhe a nova senha */
export const ResetPassword: React.FC<ResetPasswordProps> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As duas senhas não são iguais.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes('different from the old')
          ? 'A nova senha precisa ser diferente da anterior.'
          : 'Não foi possível salvar a senha. O link pode ter expirado: peça um novo em "Esqueci minha senha".'
      );
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    onDone();
  };

  return (
    <div className="min-h-screen bg-[#010013] text-white flex items-center justify-center p-4 hero-glow">
      <div className="bg-[#0b0a1f] border border-white/10 rounded-[30px] max-w-md w-full p-8 space-y-6 shadow-2xl">
        <Logo className="h-10 mx-auto" />
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5 text-[#a8aeff]" /> Criar nova senha
          </h1>
          <p className="text-xs text-gray-400">Escolha uma senha forte que você não usa em outros sites.</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Nova senha (mín. 8 caracteres)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#6b76ff] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#6b76ff] outline-none"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
