import React, { useState } from 'react';
import { Flame, ChevronDown, Languages, Globe, Layers, Package, Tag, X, Check } from 'lucide-react';
import { OfferItem } from '../../services/offersService';
import { OfferFilters, emptyFilters, lastAds } from './offerUtils';

interface FiltersPanelProps {
  offers: OfferItem[];
  filters: OfferFilters;
  onChange: (next: OfferFilters) => void;
  onClose: () => void;
}

type ListKey = 'languages' | 'networks' | 'structures' | 'productTypes' | 'niches';

const LISTS: { key: ListKey; label: string; icon: React.ElementType; field: (o: OfferItem) => string }[] = [
  { key: 'languages', label: 'Idioma', icon: Languages, field: (o) => o.language },
  { key: 'networks', label: 'Rede de tráfego', icon: Globe, field: (o) => o.network },
  { key: 'structures', label: 'Estrutura', icon: Layers, field: (o) => o.structure },
  { key: 'productTypes', label: 'Tipo de produto', icon: Package, field: (o) => o.productType },
  { key: 'niches', label: 'Nichos', icon: Tag, field: (o) => o.category },
];

const BINS = 24;
const inputClass = 'w-full min-w-0 bg-[#010013] border border-[#25244a] rounded-lg px-3 py-2 text-xs text-white focus:border-[#6b76ff] outline-none';

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ offers, filters, onChange, onClose }) => {
  const [open, setOpen] = useState<ListKey | null>(null);
  const set = (patch: Partial<OfferFilters>) => onChange({ ...filters, ...patch });

  // Distribuição de anúncios ativos (mini gráfico acima dos campos de mínimo/máximo)
  const adsList = offers.map(lastAds);
  const maxAds = Math.max(10, ...adsList);
  const bins = Array.from({ length: BINS }, () => 0);
  adsList.forEach((a) => bins[Math.min(BINS - 1, Math.floor((a / maxAds) * BINS))]++);
  const peak = Math.max(1, ...bins);
  const min = filters.minAds === '' ? 0 : Number(filters.minAds);
  const max = filters.maxAds === '' ? Infinity : Number(filters.maxAds);

  const toggle = (key: ListKey, value: string) => {
    const list = filters[key];
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as Partial<OfferFilters>);
  };

  return (
    <div className="fixed inset-x-3 top-20 md:absolute md:inset-x-auto md:left-0 md:top-full md:mt-2 z-40 md:w-80 max-h-[75vh] overflow-y-auto rounded-2xl bg-[#0b0a1f] border border-[#25244a] shadow-2xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Filtros</span>
        <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 text-gray-300 hover:text-white cursor-pointer" aria-label="Fechar filtros">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ESCALANDO */}
      <button
        onClick={() => set({ scalingOnly: !filters.scalingOnly })}
        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
        aria-pressed={filters.scalingOnly}
      >
        <span className="flex items-center gap-2 text-left">
          <Flame className="w-4 h-4 text-[#ff6b6b]" />
          <span>
            <span className="block text-xs font-bold">Escalando</span>
            <span className="block text-[10px] text-gray-400">Mais anúncios que há 7 dias</span>
          </span>
        </span>
        <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${filters.scalingOnly ? 'bg-[#3e4be1]' : 'bg-white/15'}`}>
          <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${filters.scalingOnly ? 'translate-x-4' : ''}`} />
        </span>
      </button>

      {/* QUANTIDADE DE ANÚNCIOS */}
      <div className="space-y-2">
        <span className="text-xs font-bold">Quantidade de anúncios ativos</span>
        <div className="flex items-end gap-[2px] h-12" aria-hidden="true">
          {bins.map((count, i) => {
            const from = (i / BINS) * maxAds;
            const inRange = from + maxAds / BINS >= min && from <= max;
            return (
              <span
                key={i}
                className={`flex-1 rounded-t-sm ${inRange ? 'bg-[#4f5bff]' : 'bg-white/15'}`}
                style={{ height: `${count ? Math.max(12, (count / peak) * 100) : 6}%` }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={0} placeholder="Mín." className={inputClass} value={filters.minAds} onChange={(e) => set({ minAds: e.target.value })} />
          <span className="text-gray-500">–</span>
          <input type="number" min={0} placeholder="Máx." className={inputClass} value={filters.maxAds} onChange={(e) => set({ maxAds: e.target.value })} />
        </div>
      </div>

      {/* PERÍODO */}
      <div className="space-y-2">
        <span className="text-xs font-bold">Rodando desde</span>
        <div className="flex items-center gap-2">
          <input type="date" className={inputClass} value={filters.from} onChange={(e) => set({ from: e.target.value })} aria-label="De" />
          <span className="text-gray-500">–</span>
          <input type="date" className={inputClass} value={filters.to} onChange={(e) => set({ to: e.target.value })} aria-label="Até" />
        </div>
      </div>

      {/* LISTAS */}
      <div className="divide-y divide-white/5">
        {LISTS.map(({ key, label, icon: Icon, field }) => {
          const counts = new Map<string, number>();
          offers.forEach((o) => counts.set(field(o), (counts.get(field(o)) || 0) + 1));
          filters[key].forEach((v) => counts.has(v) || counts.set(v, 0));
          const options = [...counts.entries()].sort((a, b) => b[1] - a[1]);
          const selected = filters[key].length;
          return (
            <div key={key}>
              <button
                onClick={() => setOpen(open === key ? null : key)}
                className="w-full flex items-center justify-between py-3 text-xs font-semibold cursor-pointer"
                aria-expanded={open === key}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#a8aeff]" />
                  {label}
                  {selected > 0 && <span className="px-1.5 rounded-full bg-[#3e4be1] text-[10px]">{selected}</span>}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === key ? 'rotate-180' : ''}`} />
              </button>
              {open === key && (
                <div className="pb-3 space-y-1">
                  {options.length === 0 && <span className="text-[11px] text-gray-500">Nenhuma opção ainda.</span>}
                  {options.map(([value, count]) => {
                    const on = filters[key].includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggle(key, value)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${on ? 'bg-[#3e4be1]/25 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-[#3e4be1] border-[#3e4be1]' : 'border-white/25'}`}>
                            {on && <Check className="w-3 h-3" />}
                          </span>
                          {value}
                        </span>
                        <span className="text-[10px] text-gray-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onChange(emptyFilters())} className="flex-1 py-2.5 rounded-full border border-white/15 text-xs font-semibold text-gray-300 hover:text-white cursor-pointer">
          Limpar
        </button>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-xs font-bold cursor-pointer">
          Ver ofertas
        </button>
      </div>
    </div>
  );
};
