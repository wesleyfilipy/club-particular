import React, { useState } from 'react';
import { Send, Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsManager: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setSentSuccess(true);
    setTimeout(() => {
      setTitle('');
      setBody('');
      setSentSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Disparo de Notificações Push</h2>
        <p className="text-sm text-gray-400">
          Envie alertas em tempo real para os aplicativos dos assinantes pagantes do Escala Swipe.
        </p>
      </div>

      <div className="bg-[#12141d] border border-[#282c3d] rounded-2xl p-6 space-y-6">
        {sentSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5" />
            Notificação push enviada com sucesso para 485 dispositivos ativos!
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">Título da Notificação</label>
            <input
              type="text"
              required
              placeholder="Ex: 🚨 Nova VSL 4K de Alta Conversão Liberada!"
              className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">Mensagem / Corpo da Notificação</label>
            <textarea
              rows={4}
              required
              placeholder="Digite o texto detalhado da notificação..."
              className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-base shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all"
            >
              <Send className="w-5 h-5" />
              Disparar Notificação para Membros VIP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
