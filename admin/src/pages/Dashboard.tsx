import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Download, Gift, ArrowUpRight, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { fetchOffersFromSupabase, OfferItem } from '../services/offersService';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeSubscribersCount, setActiveSubscribersCount] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('R$ 0,00');
  const [offersList, setOffersList] = useState<OfferItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Assinaturas pagas e ativas no Supabase
      const { data: subsData } = await supabase
        .from('es_subscriptions')
        .select('*')
        .eq('status', 'active');

      const subs = subsData || [];
      setActiveSubscribersCount(subs.length);
      setActiveUserIds(new Set(subs.map((s: any) => s.user_id)));
      const totalRev = subs.reduce((acc: number, curr: any) => acc + (Number(curr.price_amount) || 0), 0);
      setMonthlyRevenue(`R$ ${totalRev.toFixed(2).replace('.', ',')}`);

      // 2. Ofertas cadastradas
      const offers = await fetchOffersFromSupabase();
      setOffersList(offers);

      // 3. Contas cadastradas no Supabase (uma por e-mail)
      const { data: profiles } = await supabase.from('es_profiles').select('*');
      setUsersList(profiles || []);
    } catch (err) {
      console.warn('Erro ao carregar métricas reais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = [
    {
      title: 'Faturamento Mensal (Lastlink)',
      value: monthlyRevenue,
      change: `${activeSubscribersCount} assinatura${activeSubscribersCount === 1 ? '' : 's'} ativa${activeSubscribersCount === 1 ? '' : 's'}`,
      icon: DollarSign,
      isGold: true,
    },
    {
      title: 'Assinantes VIP Ativos',
      value: `${activeSubscribersCount} membro${activeSubscribersCount > 1 ? 's' : ''}`,
      change: 'Confirmado no Supabase',
      icon: Users,
    },
    {
      title: 'Total de Ofertas Ativas',
      value: `${offersList.length} oferta${offersList.length > 1 ? 's' : ''}`,
      change: 'Vídeos VSL 4K / 1080p',
      icon: Gift,
    },
    {
      title: 'Arquivos no Cloudflare R2',
      value: `${offersList.reduce((acc, o) => acc + (o.vslKey ? 1 : 0) + (o.creativeKey ? 1 : 0) + o.adVideos.length, 0)} arquivos`,
      change: 'VSLs, vídeos de anúncios e packs',
      icon: Download,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">Visão Geral da Plataforma & Analytics</h2>
          <p className="text-sm text-gray-400">
            Métricas reais em tempo real de assinaturas Lastlink, banco de dados Supabase e downloads de ofertas.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-gray-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6b76ff] ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all ${
                stat.isGold
                  ? 'bg-gradient-to-br from-[#0b0a1f] to-[#13122b] border-[#6b76ff]'
                  : 'bg-[#0b0a1f] border-[#25244a]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400">{stat.title}</span>
                <div className="w-10 h-10 rounded-xl bg-[#13122b] border border-[#25244a] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#6b76ff]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white mb-2">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Offer Analytics Breakdown */}
      <div className="bg-[#0b0a1f] rounded-2xl border border-[#25244a] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#6b76ff]" />
            Ofertas & Mídias Disponíveis no Banco
          </h3>
          <span className="text-xs text-gray-400">Sincronizado via Supabase</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#13122b] text-xs font-bold text-[#a8aeff] uppercase border-b border-[#25244a]">
              <tr>
                <th className="p-3 md:p-4">Oferta</th>
                <th className="p-3 md:p-4 hidden md:table-cell">Categoria</th>
                <th className="p-3 md:p-4 hidden md:table-cell">Qualidade VSL</th>
                <th className="p-3 md:p-4 hidden md:table-cell">Arquivo VSL</th>
                <th className="p-3 md:p-4 hidden md:table-cell">Criativos dos Anúncios</th>
                <th className="p-3 md:p-4">Anúncios ativos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25244a]">
              {offersList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#13122b]/50 transition-all">
                  <td className="p-3 md:p-4 font-bold text-white">
                    {item.name}
                  </td>
                  <td className="p-3 md:p-4 text-gray-300 font-semibold hidden md:table-cell">{item.category}</td>
                  <td className="p-3 md:p-4 font-bold text-[#a8aeff] hidden md:table-cell">{item.vslResolution}</td>
                  <td className="p-3 md:p-4 font-mono text-xs text-emerald-400 hidden md:table-cell">{item.vslFileName || '—'}</td>
                  <td className="p-3 md:p-4 text-purple-400 font-mono text-xs hidden md:table-cell">{item.adVideos.length}</td>
                  <td className="p-3 md:p-4 text-xs font-bold text-white">
                    {item.dailyScale.length > 0 ? item.dailyScale[item.dailyScale.length - 1].ads : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-[#0b0a1f] rounded-2xl border border-[#25244a] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Contas cadastradas (1 por e-mail)</h3>
        <div className="space-y-3">
          {usersList.length === 0 && <p className="text-xs text-gray-400">Nenhuma conta cadastrada ainda.</p>}
          {usersList.map((userItem) => {
            const isActive = activeUserIds.has(userItem.id);
            return (
              <div key={userItem.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-[#13122b] border border-[#25244a]">
                <div>
                  <span className="font-bold text-sm text-[#a8aeff]">{userItem.full_name || userItem.email}</span>
                  <p className="text-xs text-gray-300 break-all">{userItem.email}</p>
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {userItem.role === 'admin' ? 'Administrador' : isActive ? 'Assinatura paga ativa' : 'Sem assinatura paga'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
