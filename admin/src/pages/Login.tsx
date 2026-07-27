import React, { useState } from 'react';
import { Crown, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLoginSuccess: (role: 'admin' | 'member', email: string, name?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('member');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isRegistering && loginMode === 'member') {
        // CADASTRAR NOVA CONTA NO SUPABASE AUTH
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'member',
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message || 'Erro ao criar conta no Supabase.');
        }

        // Tentar salvar perfil adicional na tabela user_profiles (se existir)
        try {
          await supabase.from('user_profiles').insert({
            id: data.user?.id || `usr-${Date.now()}`,
            full_name: fullName || 'Novo Membro VIP',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            role: 'member',
          });
        } catch (dbErr) {
          console.warn('DB Profile Sync Note:', dbErr);
        }

        setSuccessMessage('Conta cadastrada e salva no Supabase com sucesso! Entrando...');
        setTimeout(() => {
          onLoginSuccess('member', email, fullName || email.split('@')[0]);
        }, 1000);
        return;
      }

      // LOGIN NA CONTA EXISTENTE
      const cleanEmail = email.trim().toLowerCase();
      const { ADMIN_EMAILS, getUserRoleFromSupabase } = await import('../services/supabase');

      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Se a conta de admin ou novo aluno ainda não existir no Supabase Auth, tenta criar a conta
      if (authError) {
        const errMsg = authError.message?.toLowerCase() || '';

        // Tratar "Email not confirmed" de forma direta e sem disparar signUp em loop (evita erro 429)
        if (errMsg.includes('email not confirmed')) {
          throw new Error('E-mail cadastrado no Supabase Auth, porém pendente de confirmação. Verifique sua caixa de e-mail ou confirme o e-mail no SQL Editor do Supabase.');
        }

        // Tentar auto-registro APENAS se as credenciais forem inválidas porque o usuário ainda não existe
        if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
          if (loginMode === 'admin' && ADMIN_EMAILS.includes(cleanEmail)) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  full_name: fullName || 'Wesley Filipy (Admin)',
                  role: 'admin',
                },
              },
            });

            if (!signUpError && signUpData?.user) {
              data = signUpData as any;
              authError = null;
            } else if (signUpError?.message?.toLowerCase().includes('already registered')) {
              throw new Error('E-mail de administrador já cadastrado, porém a senha digitada está incorreta.');
            }
          } else if (loginMode === 'member') {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  full_name: fullName || cleanEmail.split('@')[0],
                  role: 'member',
                },
              },
            });

            if (!signUpError && signUpData?.user) {
              data = signUpData as any;
              authError = null;
            } else if (signUpError?.message?.toLowerCase().includes('already registered')) {
              throw new Error('E-mail já cadastrado, porém a senha digitada está incorreta. Verifique sua senha.');
            }
          }
        }
      }

      if (authError || !data?.user) {
        if (authError?.message?.toLowerCase().includes('invalid login credentials')) {
          throw new Error('E-mail não encontrado ou senha incorreta. Se é o seu primeiro acesso, clique na aba "Criar Conta de Aluno" para se cadastrar.');
        }
        throw new Error(authError?.message || 'E-mail ou senha incorretos. Verifique suas credenciais no Supabase.');
      }

      // Verificar role oficial no Supabase DB / Lista de Administradores
      const userRole = await getUserRoleFromSupabase(data.user.id, cleanEmail);

      if (loginMode === 'admin' && userRole !== 'admin') {
        throw new Error('Acesso negado: Este e-mail não possui permissões de Administrador.');
      }

      onLoginSuccess(
        userRole,
        cleanEmail,
        data.user?.user_metadata?.full_name || fullName || cleanEmail.split('@')[0]
      );
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar autenticação. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#12141d] border border-[#d4af37]/40 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37] shadow-lg shadow-[#d4af37]/10">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider gold-text-gradient">CLUB PARTICULAR</h1>
          <p className="text-xs text-gray-400">
            {loginMode === 'admin'
              ? 'Painel Administrativo VIP • Acesso Restrito'
              : isRegistering
              ? 'Cadastro de Novo Membro / Aluno VIP'
              : 'Acesso de Membro / Aluno VIP'}
          </p>
        </div>

        {/* MODO SELETOR: ADMIN vs ALUNO/MEMBRO */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#1a1d29] border border-[#282c3d]">
          <button
            type="button"
            onClick={() => { setLoginMode('admin'); setIsRegistering(false); setError(''); setSuccessMessage(''); }}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              loginMode === 'admin'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Administrador
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('member'); setError(''); setSuccessMessage(''); }}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              loginMode === 'member'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Membro / Aluno
          </button>
        </div>

        {/* ABA DE CADASTRO OU LOGIN PARA ALUNO */}
        {loginMode === 'member' && (
          <div className="flex border-b border-[#282c3d] text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                !isRegistering ? 'border-[#d4af37] text-[#f5d77f]' : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              Já sou Aluno (Entrar)
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                isRegistering ? 'border-[#d4af37] text-[#f5d77f]' : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              Criar Conta de Aluno (Novo)
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && loginMode === 'member' && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">NOME COMPLETO DO ALUNO</label>
              <div className="relative">
                <UserCheck className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Seu Nome Completo"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL CADASTRADO NO SUPABASE</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="seu-email@dominio.com"
                className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">SENHA (SUPABASE AUTH)</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isRegistering ? 'Criando Conta no Supabase...' : 'Autenticando no Supabase...'}
              </>
            ) : isRegistering ? (
              <>
                <UserPlus className="w-5 h-5" />
                Cadastrar e Entrar como Aluno VIP
              </>
            ) : (
              <>
                {loginMode === 'admin' ? 'Entrar no Painel Administrador' : 'Acessar Área de Membros'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-500">
          🔒 Conexão segura Supabase Auth SSL. Senhas salvas com criptografia.
        </p>
      </div>
    </div>
  );
};


