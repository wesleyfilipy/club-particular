import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Ticket,
  Layers,
  Languages,
  Tag,
  Globe,
  Facebook,
  Activity,
  Download,
  FileText,
  Package,
  Share2,
  Check,
  Video,
  Image as ImageIcon,
  ExternalLink,
  CalendarDays,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { OfferItem, isImageCreative } from '../../services/offersService';
import { slugify, isR2Key, getR2PresignedDownloadUrl } from '../../services/r2';
import { ScaleChart } from '../ScaleChart';
import { lastAds, growthOf, sinceDate, formatAge } from './offerUtils';
import { OfferCover, coverCandidates } from './OfferCover';

interface OfferDetailProps {
  offer: OfferItem;
  mediaSrc: (key: string) => string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onDownload: (key: string) => void;
  downloadingKey: string | null;
  onBack: () => void;
}

type Range = 'all' | '30' | '7';
const RANGES: { id: Range; label: string }[] = [
  { id: 'all', label: 'Todo o período' },
  { id: '30', label: '30 dias' },
  { id: '7', label: '7 dias' },
];

// "há 3 meses" / "hoje"
const ago = (date: Date) => {
  const age = formatAge(date);
  return age === "hoje" ? "desde hoje" : `há ${age}`;
};

const panel = 'bg-[#0e0d0b] border border-[#2c2818] rounded-lg';

export const OfferDetail: React.FC<OfferDetailProps> = ({ offer, mediaSrc, favorite, onToggleFavorite, onDownload, downloadingKey, onBack }) => {
  const [range, setRange] = useState<Range>('all');
  const [copied, setCopied] = useState(false);
  const [showAllCreatives, setShowAllCreatives] = useState(false);

  // VSL que falhou: tenta 1 vez com um link novo (o link expira em algumas horas);
  // se continuar falhando, o formato não é suportado por este navegador
  const [freshVslUrl, setFreshVslUrl] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const vslSrc = freshVslUrl || mediaSrc(offer.vslKey);

  const handleVideoError = async () => {
    if (!retried && isR2Key(offer.vslKey)) {
      setRetried(true);
      try {
        setFreshVslUrl(await getR2PresignedDownloadUrl(offer.vslKey, false));
        return;
      } catch {
        // segue para o aviso
      }
    }
    setVideoFailed(true);
  };

  const ads = lastAds(offer);
  const growth = growthOf(offer);
  const since = sinceDate(offer);
  const active = ads > 0;
  const updated = offer.updatedAt ? new Date(offer.updatedAt) : null;

  const scale = range === 'all' ? offer.dailyScale : offer.dailyScale.slice(-Number(range));
  const creatives = showAllCreatives ? offer.adVideos : offer.adVideos.slice(0, 4);

  const pages = [
    { label: 'Site oficial', url: offer.siteUrl, icon: Globe },
    { label: 'Landing page', url: offer.landingPageUrl, icon: FileText },
    { label: 'Biblioteca de Anúncios (Meta)', url: offer.adsLibraryUrl, icon: Facebook },
  ].filter((p) => p.url);

  const info = [
    { label: 'Tipo', value: offer.ticketType || '—', icon: Ticket },
    { label: 'Estrutura', value: offer.structure, icon: Layers },
    { label: 'Idioma', value: offer.language, icon: Languages },
    { label: 'Nicho', value: offer.category, icon: Tag },
    { label: 'Tráfego', value: offer.network, icon: offer.network === 'Facebook' ? Facebook : Globe },
  ];

  const downloadTranscript = () => {
    const blob = new Blob([offer.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(offer.name) || 'oferta'}-transcricao.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(offer.landingPageUrl || offer.siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hostOf = (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  return (
    <div className="space-y-5">
      {/* TÍTULO */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer shrink-0" aria-label="Voltar para as ofertas">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white break-words">{offer.name}</h2>
            {updated && <span className="text-[11px] text-gray-400">Atualizado: {formatAge(updated) === "hoje" ? "hoje" : `há ${formatAge(updated)}`}</span>}
          </div>
        </div>
        <button
          onClick={onToggleFavorite}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 ${
            favorite ? 'bg-amber-400/15 border-amber-400/40 text-amber-200' : 'bg-white/5 border-white/10 text-gray-200'
          }`}
        >
          <Star className="w-4 h-4" fill={favorite ? 'currentColor' : 'none'} />
          <span className="hidden sm:inline">{favorite ? 'Favoritada' : 'Favoritar'}</span>
        </button>
      </div>

      {/* FAIXA DE INFORMAÇÕES */}
      <div className={`${panel} relative overflow-hidden`}>
        <span className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-[#f6e27a] via-[#d4af37] to-[#a8801f]" />
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-[#2c2818] [&>div]:border-[#2c2818] [&>div]:border-b xl:[&>div]:border-b-0 xl:[&>div:not(:last-child)]:border-r">
          {info.map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-4 py-3 min-w-0">
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                <Icon className="w-3.5 h-3.5 text-[#d4af37]" /> {label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white truncate">{value}</dd>
            </div>
          ))}
          <div className="px-4 py-3 min-w-0">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
              <Activity className="w-3.5 h-3.5 text-[#d4af37]" /> Campanha
            </dt>
            <dd className={`mt-1 text-sm font-bold ${active ? 'text-emerald-400' : 'text-gray-400'}`}>{active ? '● Ativa' : 'Pausada'}</dd>
          </div>
        </dl>
      </div>

      {/* VSL + PAINEL LATERAL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 aspect-video bg-black rounded-lg overflow-hidden border border-[#2c2818]">
          {vslSrc && videoFailed ? (
            <div className="relative w-full h-full bg-gradient-to-br from-[#d4af37]/25 to-[#0e0d0b]/25">
              <OfferCover offer={offer} mediaSrc={mediaSrc} className="opacity-30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm font-semibold text-white">Seu navegador não conseguiu reproduzir esta VSL.</p>
                <p className="text-xs text-gray-300 max-w-sm">O vídeo pode estar num formato que este navegador não toca. Baixe para assistir no seu computador ou celular.</p>
                <button
                  onClick={() => onDownload(offer.vslKey)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar VSL
                </button>
              </div>
            </div>
          ) : vslSrc ? (
            <video
              key={vslSrc}
              controls
              playsInline
              preload="metadata"
              poster={coverCandidates(offer, mediaSrc).find((c) => c.type === 'image')?.src}
              className="w-full h-full object-contain"
              src={vslSrc}
              onError={handleVideoError}
            />
          ) : offer.vslKey ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Carregando VSL...</div>
          ) : (
            // Sem VSL: mostra a capa, um criativo ou a página do site no lugar da tela vazia
            <div className="relative w-full h-full bg-gradient-to-br from-[#d4af37]/25 to-[#0e0d0b]/25">
              <OfferCover offer={offer} mediaSrc={mediaSrc} />
              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 text-[11px] text-gray-200">Esta oferta não tem VSL em vídeo</span>
            </div>
          )}
        </div>

        <div className={`${panel} lg:col-span-2 p-4 flex flex-col gap-4 min-w-0`}>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {since && (
              <span className="flex items-center gap-1 text-gray-300">
                <CalendarDays className="w-3.5 h-3.5" /> Rodando {ago(since)}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-200 font-semibold">{ads.toLocaleString('pt-BR')} anúncios ativos</span>
            {growth !== 0 && (
              <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${growth > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" /> {growth > 0 ? '+' : ''}{growth.toLocaleString('pt-BR')} em 7 dias
              </span>
            )}
          </div>

          <div className="space-y-2 flex-1 min-h-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Transcrição</span>
            <div className="max-h-56 lg:max-h-64 overflow-y-auto rounded-md bg-black/30 border border-white/5 p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
              {offer.transcript || offer.description || 'A transcrição desta VSL ainda não está disponível.'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {offer.vslKey && (
              <button
                onClick={() => onDownload(offer.vslKey)}
                disabled={!offer.vslKey || downloadingKey === offer.vslKey}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {downloadingKey === offer.vslKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Baixar VSL
              </button>
            )}
            {offer.transcript && (
              <button onClick={downloadTranscript} className="px-4 py-2 rounded-lg bg-[#d4af37]/25 border border-[#d4af37]/50 text-[#f3dc9a] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                <FileText className="w-4 h-4" /> Baixar transcrição
              </button>
            )}
            {offer.creativeKey && (
              <button
                onClick={() => onDownload(offer.creativeKey)}
                disabled={downloadingKey === offer.creativeKey}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Package className="w-4 h-4" /> Baixar pack
              </button>
            )}
            {(offer.landingPageUrl || offer.siteUrl) && (
              <button onClick={copyLink} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copiado!</> : <><Share2 className="w-4 h-4" /> Copiar link</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CRIATIVOS + ANÁLISES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${panel} p-4 space-y-3 min-w-0`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Video className="w-4 h-4 text-[#e8c766]" /> Criativos
              <span className="text-[11px] font-normal text-gray-400">({offer.adVideos.length})</span>
            </h3>
            {offer.adVideos.length > 4 && (
              <button onClick={() => setShowAllCreatives((v) => !v)} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200 cursor-pointer">
                {showAllCreatives ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
          {offer.adVideos.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Nenhum criativo enviado para esta oferta.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {creatives.map((ad) => (
                <div key={ad.key} className="rounded-md overflow-hidden border border-[#2c2818] bg-[#17150f]">
                  {!mediaSrc(ad.key) ? (
                    <div className="w-full aspect-[4/5] bg-black flex items-center justify-center text-[11px] text-gray-500">Carregando...</div>
                  ) : isImageCreative(ad) ? (
                    <img src={mediaSrc(ad.key)} alt={ad.name} loading="lazy" className="w-full aspect-[4/5] bg-black object-contain" />
                  ) : (
                    <video controls preload="metadata" className="w-full aspect-[4/5] bg-black object-contain" src={mediaSrc(ad.key)} />
                  )}
                  <div className="p-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-300 truncate flex items-center gap-1">
                      {isImageCreative(ad) ? <ImageIcon className="w-3 h-3 shrink-0" /> : <Video className="w-3 h-3 shrink-0" />}
                      {ad.name}
                    </span>
                    <button
                      onClick={() => onDownload(ad.key)}
                      disabled={downloadingKey === ad.key}
                      className="p-1.5 rounded-md bg-[#0e0d0b] border border-[#2c2818] text-[#e8c766] cursor-pointer disabled:opacity-40 shrink-0"
                      title="Baixar"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${panel} p-4 space-y-3 min-w-0`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#e8c766]" /> Análises — anúncios ativos por dia
          </h3>
          <div className="flex p-1 rounded-lg bg-white/5 border border-white/10">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer ${range === r.id ? 'bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <ScaleChart data={scale} />
        </div>
      </div>

      {/* PÁGINAS */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold">Páginas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pages.map(({ label, url, icon: Icon }) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className={`${panel} p-4 flex items-center gap-3 hover:border-[#d4af37]/50 transition-colors min-w-0`}>
                <span className="w-10 h-10 rounded-md bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#e8c766]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-white">{label}</span>
                  <span className="block text-[11px] text-gray-400 truncate">{hostOf(url)}</span>
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
