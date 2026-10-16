import React from 'react';
import { Star, BarChart3, Clock, Play, Facebook, Globe, Layers, Package, Languages, TrendingUp } from 'lucide-react';
import { OfferItem } from '../../services/offersService';
import { lastAds, growthOf, sinceDate, formatAge, formatShortDate, isNewOffer } from './offerUtils';

interface OfferCardProps {
  offer: OfferItem;
  posterSrc: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

const Tag: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-gray-200 whitespace-nowrap">
    {icon}
    {label}
  </span>
);

export const OfferCard: React.FC<OfferCardProps> = ({ offer, posterSrc, favorite, onToggleFavorite, onOpen }) => {
  const ads = lastAds(offer);
  const growth = growthOf(offer);
  const since = sinceDate(offer);
  const active = ads > 0;

  return (
    <div className="bg-[#0b0a1f] border border-[#25244a] hover:border-[#6b76ff]/50 rounded-2xl p-3 flex flex-col gap-3 transition-colors">
      {/* TOPO: anúncios ativos, tempo rodando, ações */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0">
            <span className="truncate">{ads.toLocaleString('pt-BR')} anúncios</span>
            {growth > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                <TrendingUp className="w-3 h-3" />+{growth.toLocaleString('pt-BR')}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpen}
              className="p-1.5 rounded-full bg-[#3e4be1]/20 text-[#a8aeff] hover:bg-[#3e4be1]/40 cursor-pointer"
              title="Ver gráfico de escala"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${favorite ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={favorite}
            >
              <Star className="w-3.5 h-3.5" fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatAge(since)}
          </span>
          <span className="flex items-center gap-1.5">
            {isNewOffer(offer) && (
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-[9px] font-extrabold text-white">NOVA</span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-400'
              }`}
            >
              {active ? 'Ativo' : 'Sem anúncios'}
            </span>
          </span>
        </div>
      </div>

      {/* MEIO: data, nome, nicho */}
      <button onClick={onOpen} className="text-center space-y-1 cursor-pointer group">
        {since && <span className="block text-[10px] text-gray-400">{formatShortDate(since)}</span>}
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#a8aeff] transition-colors">{offer.name}</h3>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {offer.category}
        </span>
      </button>

      {/* CAPA DA VSL */}
      <button onClick={onOpen} className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[#bc060f]/25 to-[#3e4be1]/25 cursor-pointer group">
        {posterSrc && <img src={posterSrc} alt={`Capa da VSL ${offer.name}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <span className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-90 group-hover:opacity-100">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </span>
        </span>
      </button>

      {/* RODAPÉ: etiquetas */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Tag icon={offer.network === 'Facebook' ? <Facebook className="w-3 h-3 text-[#4f8cff]" /> : <Globe className="w-3 h-3 text-[#a8aeff]" />} label={offer.network} />
        <Tag icon={<Layers className="w-3 h-3 text-[#a8aeff]" />} label={offer.structure} />
        <Tag icon={<Package className="w-3 h-3 text-[#a8aeff]" />} label={offer.productType} />
        <Tag icon={<Languages className="w-3 h-3 text-[#a8aeff]" />} label={offer.language} />
      </div>
    </div>
  );
};
