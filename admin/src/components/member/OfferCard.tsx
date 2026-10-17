import React from 'react';
import { Star, Play, TrendingUp, Clock, Megaphone } from 'lucide-react';
import { OfferItem } from '../../services/offersService';
import { lastAds, growthOf, sinceDate, formatAge, isNewOffer } from './offerUtils';
import { OfferCover } from './OfferCover';

interface OfferCardProps {
  offer: OfferItem;
  mediaSrc: (key: string) => string; // chave do R2 -> URL assinada
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, mediaSrc, favorite, onToggleFavorite, onOpen }) => {
  const ads = lastAds(offer);
  const growth = growthOf(offer);
  const since = sinceDate(offer);
  const active = ads > 0;
  const details = [offer.network, offer.structure, offer.productType, offer.language].filter(Boolean);

  return (
    <div className="group relative flex flex-col bg-[#0e0d0b] border border-[#2c2818] hover:border-[#d4af37]/60 rounded-md overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-12px_rgba(212,175,55,0.35)]">
      {/* Filete dourado no topo */}
      <span className="absolute top-0 inset-x-0 h-[2px] z-10 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-70" />

      {/* CAPA ocupando a largura toda, com selos por cima */}
      <button onClick={onOpen} className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#2c2818] to-[#0e0d0b] cursor-pointer">
        <OfferCover offer={offer} mediaSrc={mediaSrc} className="transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-transparent to-black/40" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rotate-45 bg-black/60 backdrop-blur-sm border border-[#d4af37]/70 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:bg-[#d4af37] transition-colors">
            <Play className="w-5 h-5 -rotate-45 ml-0.5 text-[#f3dc9a] group-hover:text-black" />
          </span>
        </span>
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
              active ? 'bg-black/70 text-emerald-400 border border-emerald-400/40' : 'bg-black/70 text-gray-400 border border-white/15'
            }`}
          >
            {active ? '● Ativa' : 'Pausada'}
          </span>
          {isNewOffer(offer) && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-[9px] font-extrabold uppercase tracking-widest text-black">Nova</span>
          )}
        </span>
        <span className="absolute bottom-2.5 left-3 right-3 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#e8c766] truncate">{offer.category}</span>
        </span>
      </button>

      <button
        onClick={onToggleFavorite}
        className={`absolute top-2.5 right-2.5 z-10 p-1.5 cursor-pointer transition-colors border ${
          favorite ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-black/60 border-white/15 text-gray-200 hover:text-[#f3dc9a]'
        }`}
        title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={favorite}
      >
        <Star className="w-3.5 h-3.5" fill={favorite ? 'currentColor' : 'none'} />
      </button>

      {/* NOME */}
      <button onClick={onOpen} className="px-4 pt-3 text-left cursor-pointer">
        <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[#f3dc9a] transition-colors">{offer.name}</h3>
      </button>

      {/* NÚMEROS lado a lado */}
      <div className="mx-4 mt-3 grid grid-cols-2 divide-x divide-[#2c2818] border-y border-[#2c2818]">
        <div className="py-2.5 pr-3">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
            <Megaphone className="w-3 h-3" /> Anúncios
          </span>
          <span className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-white">{ads.toLocaleString('pt-BR')}</span>
            {growth > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                <TrendingUp className="w-3 h-3" />+{growth.toLocaleString('pt-BR')}
              </span>
            )}
          </span>
        </div>
        <div className="py-2.5 pl-3">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
            <Clock className="w-3 h-3" /> Rodando
          </span>
          <span className="block mt-0.5 text-sm font-bold text-[#e8c766] truncate">{formatAge(since) || '—'}</span>
        </div>
      </div>

      {/* DETALHES em uma linha */}
      <p className="px-4 py-3 text-[11px] text-gray-400 truncate">{details.join('  ·  ')}</p>
    </div>
  );
};
