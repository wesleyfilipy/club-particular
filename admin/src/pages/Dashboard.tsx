import React from 'react';
import { Users, DollarSign, Download, Gift, ArrowUpRight, Eye, Video, Globe, BookOpen, Package } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Faturamento Mensal (Stripe)', value: 'R$ 48.500,00', change: '+18.4%', icon: DollarSign, isGold: true },
    { title: 'Assinantes VIP Ativos', value: '485 membros', change: '+32 esta semana', icon: Users },
    { title: 'Total de Ofertas Ativas', value: '14 ofertas', change: 'Todas VSLs 4K', icon: Gift },
    { title: 'Downloads do Cloudflare R2', value: '3.892 arquivos', change: '+412 hoje', icon: Download },
  ];

  const offerAnalytics = [
    {
      name: 'Fórmula Seca Barriga Natural 3.0',
      category: 'Saúde & Emagrecimento',
      views: '12.450',
      vslWatched: '8.920',
      vslDownloads: '1.420',
      creativesDownloads: '980',
      siteClicks: '3.150',
      adsLibraryClicks: '2.400',
    },
    {
      name: 'Método Milionário com IA (MMIA)',
      category: 'Renda Extra & Finanças',
      views: '18.900',
      vslWatched: '14.100',
      vslDownloads: '2.840',
      creativesDownloads: '1.650',
      siteClicks: '5.200',
      adsLibraryClicks: '3.890',
    },
    {
      name: 'Código Secreto da Sedução Suprema',
      category: 'Relacionamento & Conquista',
      views: '8.720',
      vslWatched: '5.400',
      vslDownloads: '890',
      creativesDownloads: '620',
      siteClicks: '1.980',
      adsLibraryClicks: '1.410',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Visão Geral da Plataforma & Analytics</h2>
        <p className="text-sm text-gray-400">
          Métricas em tempo real de assinaturas Stripe, downloads R2 e comportamento dos membros.
        </p>
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
                  ? 'bg-gradient-to-br from-[#12141d] to-[#1a1d29] border-[#d4af37]'
                  : 'bg-[#12141d] border-[#282c3d]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400">{stat.title}</span>
                <div className="w-10 h-10 rounded-xl bg-[#1a1d29] border border-[#282c3d] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#d4af37]" />
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
      <div className="bg-[#12141d] rounded-2xl border border-[#282c3d] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#d4af37]" />
            Estatísticas Detalhadas por Oferta
          </h3>
          <span className="text-xs text-gray-400">Atualizado via Supabase Analytics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1a1d29] text-xs font-bold text-[#f5d77f] uppercase border-b border-[#282c3d]">
              <tr>
                <th className="p-4">Oferta VIP</th>
                <th className="p-4">👁 Visualizações</th>
                <th className="p-4">🎥 VSL Assistidas</th>
                <th className="p-4">⬇ Downloads VSL</th>
                <th className="p-4">📦 Criativos</th>
                <th className="p-4">🌐 Site Oficial</th>
                <th className="p-4">📚 Ads Library</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282c3d]">
              {offerAnalytics.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1a1d29]/50 transition-all">
                  <td className="p-4 font-bold text-white">
                    {item.name}
                    <div className="text-xs text-gray-400 font-normal">{item.category}</div>
                  </td>
                  <td className="p-4 font-bold text-white">{item.views}</td>
                  <td className="p-4 font-bold text-[#f5d77f]">{item.vslWatched}</td>
                  <td className="p-4 font-bold text-emerald-400">{item.vslDownloads}</td>
                  <td className="p-4 text-purple-400 font-bold">{item.creativesDownloads}</td>
                  <td className="p-4 text-blue-400 font-bold">{item.siteClicks}</td>
                  <td className="p-4 text-amber-400 font-bold">{item.adsLibraryClicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-[#12141d] rounded-2xl border border-[#282c3d] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Últimas Ações & Downloads dos Membros</h3>
        <div className="space-y-3">
          {[
            { user: 'Gabriel Siqueira', action: 'Descarregou VSL_Formula_Seca_Barriga_4K.mp4 do Cloudflare R2', time: 'Há 4 minutos' },
            { user: 'Camila Santos', action: 'Baixou Pack_Criativos_Canva_Design.zip (145 MB)', time: 'Há 12 minutos' },
            { user: 'Rodrigo M.', action: 'Nova assinatura Stripe de R$ 100,00/mês ativada com sucesso', time: 'Há 25 minutos' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d]">
              <div>
                <span className="font-bold text-sm text-[#f5d77f]">{item.user}</span>
                <p className="text-xs text-gray-300">{item.action}</p>
              </div>
              <span className="text-xs text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
