import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ShieldCheck, LogOut, Smartphone, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Logo } from '../components/Logo';

interface AdminMfaProps {
  email: string;
  onVerified: () => void;
  onLogout: () => void;
  onCancel?: () => void; // volta para a página principal sem sair da conta
}

type Mode = 'email' | 'loading' | 'enroll' | 'verify';

/**
 * Verificação em 2 etapas do administrador: código enviado ao e-mail (padrão)
 * ou código do app autenticador. Sem ela, o banco e as funções não reconhecem os poderes de admin.
 */
export const AdminMfa: React.FC<AdminMfaProps> = ({ email, onVerified, onLogout, onCancel }) => {
  const [mode, setMode] = useState<Mode>('email');
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const maskedEmail = email.replace(/^(.{2})[^@]*/, '$1•••');

  // Contagem para poder pedir outro código
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const sendEmailCode = async () => {
    setBusy(true);
    setError('');
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (sendError) {
      const wait = sendError.message.match(/(\d+) seconds?/);
      setError(
        wait
          ? `Aguarde ${wait[1]} segundos para pedir um novo código.`
          : /rate limit/i.test(sendError.message)
          ? 'Limite de e-mails por hora atingido. Tente mais tarde ou use o app autenticador.'
          : 'Não foi possível enviar o código. Tente de novo ou use o app autenticador.'
      );
      return;
    }
    setEmailSent(true);
    setCode('');
    setCooldown(60);
  };

  // App autenticador: só é preparado quando a pessoa escolhe usar o app
  const chooseApp = async () => {
    setError('');
    setCode('');
    setMode('loading');

    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError('Não foi possível iniciar a verificação. Saia e entre de novo.');
      return;
    }
    const verified = data.totp.find((f) => f.status === 'verified');
    if (verified) {
      setFactorId(verified.id);
      setMode('verify');
      return;
    }

    // Primeiro acesso: remove cadastros incompletos e gera o QR code
    for (const f of data.all.filter((f) => f.status !== 'verified')) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Escala Swipe Admin ${new Date().toISOString().slice(0, 10)}`,
    });
    if (enrollError || !enrolled) {
      setError(enrollError?.message || 'Não foi possível gerar o QR code.');
      return;
    }
    setFactorId(enrolled.id);
    setQrCode(enrolled.totp.qr_code);
    setSecret(enrolled.totp.secret);
    setMode('enroll');
  };

  const chooseEmail = () => {
    setError('');
    setCode('');
    setMode('email');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: verifyError } =
      mode === 'email'
        ? await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
        : await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (verifyError) {
      setError(
        mode === 'email'
          ? 'Código incorreto ou expirado. Confira o último e-mail recebido ou peça um novo código.'
          : 'Código incorreto ou expirado. Digite o código que aparece agora no app.'
      );
      setCode('');
      return;
    }
    onVerified();
  };

  const isEmail = mode === 'email';
  const codeOk = isEmail ? code.length >= 6 : code.length === 6;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 hero-glow">
      <div className="bg-[#0e0d0b] border border-white/10 rounded-xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <Logo className="h-10 mx-auto" />

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#e8c766]" /> Verificação do administrador
          </h1>
          <p className="text-xs text-gray-400">
            {isEmail
              ? emailSent
                ? `Enviamos um e-mail para ${maskedEmail}. Digite o código dele abaixo ou, se o e-mail tiver só um link, clique nele neste computador e depois em "Admin".`
                : `Vamos enviar um código de acesso para o seu e-mail (${maskedEmail}).`
              : mode === 'enroll'
              ? 'Primeiro acesso: proteja o painel com o app autenticador do seu celular.'
              : 'Digite o código de 6 dígitos do seu app autenticador.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'loading' && !error && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          </div>
        )}

        {mode === 'enroll' && (
          <div className="space-y-4">
            <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>
                Instale o <strong className="text-white">Google Authenticator</strong> ou o <strong className="text-white">Microsoft Authenticator</strong> no celular
              </li>
              <li>No app, toque em <strong className="text-white">+</strong> e escaneie o QR code abaixo</li>
              <li>Digite o código de 6 dígitos que aparecer no app</li>
            </ol>
            <div className="bg-white rounded-lg p-3 w-48 h-48 mx-auto flex items-center justify-center">
              <img src={qrCode} alt="QR code para o app autenticador" className="w-full h-full" />
            </div>
            <p className="text-[11px] text-gray-400 text-center break-all">
              Não consegue escanear? Digite esta chave no app: <span className="font-mono text-gray-200">{secret}</span>
            </p>
          </div>
        )}

        {isEmail && !emailSent && (
          <button
            onClick={sendEmailCode}
            disabled={busy}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4" /> Enviar código para o e-mail</>}
          </button>
        )}

        {mode !== 'loading' && (!isEmail || emailSent) && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              {isEmail ? (
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              ) : (
                <Smartphone className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              )}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={isEmail ? '[0-9]{6,10}' : '[0-9]{6}'}
                maxLength={isEmail ? 10 : 6}
                required
                autoFocus
                placeholder="000000"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-lg tracking-[0.4em] text-white placeholder-gray-600 focus:border-[#d4af37] outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button
              type="submit"
              disabled={busy || !codeOk}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'enroll' ? 'Ativar e entrar' : 'Confirmar'}
            </button>
            {isEmail && (
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={busy || cooldown > 0}
                className="w-full text-xs text-gray-400 hover:text-white cursor-pointer disabled:cursor-default disabled:hover:text-gray-400"
              >
                {cooldown > 0 ? `Não chegou? Reenviar em ${cooldown}s (veja também o spam)` : 'Reenviar código'}
              </button>
            )}
          </form>
        )}

        <div className="text-center">
          <button onClick={isEmail ? chooseApp : chooseEmail} className="text-xs text-[#e8c766] hover:text-white cursor-pointer">
            {isEmail ? 'Prefiro usar o app autenticador' : 'Receber o código por e-mail'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          {onCancel && (
            <button onClick={onCancel} className="text-xs text-gray-400 hover:text-white cursor-pointer">
              Voltar ao site
            </button>
          )}
          <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </div>
    </div>
  );
};
