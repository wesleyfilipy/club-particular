import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UploadCloud, Film, Package, CheckCircle2, Image as ImageIcon, Video, X, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { uploadToR2, R2_BUCKET, slugify, getR2PresignedDownloadUrl } from '../services/r2';
import { captureVideoFrame } from '../services/thumbnail';
import {
  OfferItem,
  OfferInput,
  ScalePoint,
  fetchOffersFromSupabase,
  createOffer,
  updateOffer,
  deleteOffer,
  isImageCreative,
  NETWORKS,
  STRUCTURES,
  PRODUCT_TYPES,
  LANGUAGES,
  TICKET_TYPES,
  NICHES,
} from '../services/offersService';
import { ScaleChart } from '../components/ScaleChart';

const CATEGORIES = NICHES;

const emptyForm = (): OfferInput => ({
  name: '',
  category: CATEGORIES[0],
  commission: '',
  description: '',
  vslKey: '',
  vslFileName: '',
  vslResolution: '1080p Full HD',
  posterKey: '',
  creativeKey: '',
  creativeFileName: '',
  creativeFileSize: '',
  adVideos: [],
  dailyScale: [],
  siteUrl: '',
  landingPageUrl: '',
  adsLibraryUrl: '',
  network: NETWORKS[0],
  structure: STRUCTURES[0],
  productType: PRODUCT_TYPES[0],
  language: LANGUAGES[0],
  startedAt: '',
  ticketType: TICKET_TYPES[0],
  transcript: '',
});

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 * 1024
    ? `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const today = () => new Date().toISOString().slice(0, 10);

type UploadSlot = 'vsl' | 'poster' | 'ads' | 'creative';

// Quantas ofertas podem ser cadastradas de uma vez (uma por aba)
const BATCH_SIZE = 3;

interface Draft {
  folder: string; // pasta da oferta no R2
  form: OfferInput;
}

const newDraft = (n: number): Draft => ({ folder: `oferta-${Date.now()}-${n}`, form: emptyForm() });

const hasContent = (f: OfferInput) =>
  !!(f.name.trim() || f.vslKey || f.posterKey || f.creativeKey || f.adVideos.length || f.dailyScale.length);

export const OffersManager: React.FC = () => {
  const [offersList, setOffersList] = useState<OfferItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraft, setActiveDraft] = useState(0);
  // Uploads em andamento, por aba: "<aba>-<slot>" -> porcentagem
  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scaleDate, setScaleDate] = useState(today());
  const [scaleAds, setScaleAds] = useState('');

  const formData = drafts[activeDraft]?.form || emptyForm();

  const updateDraft = (idx: number, updater: (prev: OfferInput) => OfferInput) =>
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, form: updater(d.form) } : d)));

  // Edita a aba ativa
  const setFormData = (next: OfferInput | ((prev: OfferInput) => OfferInput)) =>
    updateDraft(activeDraft, typeof next === 'function' ? next : () => next);

  const loadOffers = async () => {
    setLoadingList(true);
    setOffersList(await fetchOffersFromSupabase());
    setLoadingList(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDrafts(Array.from({ length: BATCH_SIZE }, (_, i) => newDraft(i + 1)));
    setActiveDraft(0);
    setError('');
    setShowModal(true);
  };

  const openEdit = (offer: OfferItem) => {
    const { id, ...rest } = offer;
    setEditingId(id);
    setDrafts([{ folder: id, form: rest }]);
    setActiveDraft(0);
    setError('');
    setShowModal(true);
  };

  const isUploading = Object.keys(uploads).length > 0;
  const uploadingIn = (idx: number) => Object.keys(uploads).some((k) => k.startsWith(`${idx}-`));

  // Envia um arquivo para offers/<pasta-da-oferta>/<subpasta>/<arquivo> no Cloudflare R2.
  // O resultado vai para a aba onde o upload começou, mesmo que você troque de aba no meio.
  const uploadFile = async (idx: number, slot: UploadSlot, subfolder: string, file: File) => {
    const uploadId = `${idx}-${slot}`;
    const keyPath = `offers/${drafts[idx].folder}/${subfolder}/${Date.now()}-${slugify(file.name)}`;
    setError('');
    setUploads((prev) => ({ ...prev, [uploadId]: 0 }));
    try {
      await uploadToR2(file, keyPath, file.type || 'application/octet-stream', (percent) =>
        setUploads((prev) => ({ ...prev, [uploadId]: percent }))
      );
      return keyPath;
    } catch (err: any) {
      setError(`Oferta ${idx + 1}: ${err.message || 'Erro no upload para o Cloudflare R2.'}`);
      return null;
    } finally {
      setUploads((prev) => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
    }
  };

  const handleVslUpload = async (file: File) => {
    const idx = activeDraft;
    // Sem capa enviada: gera a capa a partir de um quadro da própria VSL (em paralelo ao upload)
    if (!drafts[idx].form.posterKey) autoPosterFromVideo(idx, file);
    const key = await uploadFile(idx, 'vsl', 'vsl', file);
    if (key) updateDraft(idx, (prev) => ({ ...prev, vslKey: key, vslFileName: file.name }));
  };

  const autoPosterFromVideo = async (idx: number, file: File) => {
    try {
      const frame = await captureVideoFrame(file);
      const posterFile = new File([frame], 'capa-automatica.jpg', { type: 'image/jpeg' });
      const key = await uploadFile(idx, 'poster', 'poster', posterFile);
      // Não substitui uma capa que você tenha enviado nesse meio-tempo
      if (key) updateDraft(idx, (prev) => (prev.posterKey ? prev : { ...prev, posterKey: key }));
    } catch {
      // Formato que o navegador não lê: a oferta fica sem capa e você pode enviar uma imagem
    }
  };

  // Ofertas já cadastradas sem capa: gera a capa a partir da VSL que está no R2
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const handleGeneratePoster = async (offer: OfferItem) => {
    if (!offer.vslKey) return;
    setGeneratingPoster(offer.id);
    try {
      const videoUrl = await getR2PresignedDownloadUrl(offer.vslKey, false);
      const frame = await captureVideoFrame(videoUrl);
      const keyPath = `offers/${offer.id}/poster/${Date.now()}-capa-automatica.jpg`;
      await uploadToR2(frame, keyPath, 'image/jpeg');
      const { id, ...rest } = offer;
      const updated = await updateOffer(id, { ...rest, posterKey: keyPath });
      setOffersList((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err: any) {
      alert(`Não foi possível gerar a capa: ${err.message}`);
    } finally {
      setGeneratingPoster(null);
    }
  };

  const handlePosterUpload = async (file: File) => {
    const idx = activeDraft;
    const key = await uploadFile(idx, 'poster', 'poster', file);
    if (key) updateDraft(idx, (prev) => ({ ...prev, posterKey: key }));
  };

  const handleAdVideosUpload = async (files: FileList) => {
    const idx = activeDraft;
    for (const file of Array.from(files)) {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const key = await uploadFile(idx, 'ads', 'ad-videos', file);
      if (key) updateDraft(idx, (prev) => ({ ...prev, adVideos: [...prev.adVideos, { key, name: file.name, type }] }));
    }
  };

  const handleCreativeUpload = async (file: File) => {
    const idx = activeDraft;
    const key = await uploadFile(idx, 'creative', 'creatives', file);
    if (key) {
      updateDraft(idx, (prev) => ({
        ...prev,
        creativeKey: key,
        creativeFileName: file.name,
        creativeFileSize: formatSize(file.size),
      }));
    }
  };

  // Adiciona/atualiza o número de anúncios ativos de um dia
  const addScalePoint = () => {
    const ads = parseInt(scaleAds, 10);
    if (!scaleDate || isNaN(ads) || ads < 0) return;
    setFormData((prev) => {
      const others = prev.dailyScale.filter((p) => p.date !== scaleDate);
      const next: ScalePoint[] = [...others, { date: scaleDate, ads }].sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, dailyScale: next };
    });
    setScaleAds('');
  };

  const removeScalePoint = (date: string) =>
    setFormData((prev) => ({ ...prev, dailyScale: prev.dailyScale.filter((p) => p.date !== date) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setError('');

    // Abas preenchidas (as vazias são ignoradas)
    const filled = drafts.map((d, i) => ({ ...d, idx: i })).filter((d) => hasContent(d.form));
    if (filled.length === 0) {
      setError('Preencha pelo menos uma oferta.');
      return;
    }
    const invalid = filled.find((d) => !d.form.name.trim());
    if (invalid) {
      setActiveDraft(invalid.idx);
      setError(`Oferta ${invalid.idx + 1}: preencha o nome da oferta.`);
      return;
    }

    setSaving(true);

    if (editingId) {
      try {
        const updated = await updateOffer(editingId, drafts[0].form);
        setOffersList((prev) => prev.map((o) => (o.id === editingId ? updated : o)));
        setShowModal(false);
      } catch (err: any) {
        setError(`Erro ao salvar no Supabase: ${err.message}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Salva da última para a primeira: a lista mostra a mais nova primeiro,
    // então para os membros as ofertas aparecem na ordem 1, 2, 3.
    const created: OfferItem[] = [];
    const savedIdx = new Set<number>();
    let failure = '';
    for (const d of [...filled].reverse()) {
      try {
        created.unshift(await createOffer(d.form));
        savedIdx.add(d.idx);
      } catch (err: any) {
        setActiveDraft(d.idx);
        failure = `Oferta ${d.idx + 1}: ${err.message}`;
        break;
      }
    }

    setOffersList((prev) => [...created, ...prev]);
    setSaving(false);

    if (failure) {
      // Limpa as abas já salvas para não duplicar ao tentar de novo
      setDrafts((prev) => prev.map((d, i) => (savedIdx.has(i) ? newDraft(i + 1) : d)));
      setError(`Erro ao salvar no Supabase. ${failure}`);
      return;
    }
    setShowModal(false);
  };

  const handleDelete = async (offer: OfferItem) => {
    if (!confirm(`Excluir a oferta "${offer.name}"?`)) return;
    try {
      await deleteOffer(offer.id);
      setOffersList((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const uploadLabel = (slot: UploadSlot, idle: string) => {
    const percent = uploads[`${activeDraft}-${slot}`];
    return percent !== undefined ? `Enviando... ${percent}%` : idle;
  };

  const filledCount = drafts.filter((d) => hasContent(d.form)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">Gerenciamento de Ofertas</h2>
          <p className="text-sm text-gray-400">
            VSLs, vídeos dos anúncios e packs vão direto para o Cloudflare R2. Os dados da oferta e o gráfico de escala ficam no Supabase.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-bold text-sm shadow-lg shadow-[#6b76ff]/20 hover:opacity-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Novas Ofertas
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-[#0b0a1f] rounded-2xl border border-[#25244a] overflow-x-auto shadow-2xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#13122b] text-xs font-bold text-[#a8aeff] uppercase border-b border-[#25244a]">
            <tr>
              <th className="p-3 md:p-4">Nome da Oferta</th>
              <th className="p-3 md:p-4 hidden md:table-cell">Categoria</th>
              <th className="p-3 md:p-4 hidden md:table-cell">VSL (R2)</th>
              <th className="p-3 md:p-4 hidden md:table-cell">Criativos dos Anúncios</th>
              <th className="p-3 md:p-4">Escala (hoje)</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#25244a]">
            {loadingList && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-gray-400">Carregando ofertas do Supabase...</td>
              </tr>
            )}
            {!loadingList && offersList.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-gray-400">Nenhuma oferta cadastrada ainda.</td>
              </tr>
            )}
            {offersList.map((offer) => (
              <tr key={offer.id} className="hover:bg-[#13122b]/50 transition-all">
                <td className="p-3 md:p-4 font-bold text-white">{offer.name}</td>
                <td className="p-3 md:p-4 hidden md:table-cell">
                  <span className="px-3 py-1 rounded-full bg-[#13122b] border border-[#25244a] text-xs font-medium text-gray-300">
                    {offer.category}
                  </span>
                </td>
                <td className="p-3 md:p-4 hidden md:table-cell">
                  {offer.vslFileName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      {offer.vslFileName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Sem VSL</span>
                  )}
                </td>
                <td className="p-3 md:p-4 text-xs font-semibold hidden md:table-cell">{offer.adVideos.length} criativo{offer.adVideos.length === 1 ? '' : 's'}</td>
                <td className="p-3 md:p-4 text-xs font-semibold">
                  {offer.dailyScale.length > 0 ? `${offer.dailyScale[offer.dailyScale.length - 1].ads} anúncios` : '—'}
                </td>
                <td className="p-3 md:p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {offer.vslKey && !offer.posterKey && (
                      <button
                        onClick={() => handleGeneratePoster(offer)}
                        disabled={generatingPoster === offer.id}
                        className="px-3 py-2 rounded-lg bg-[#13122b] text-[#a8aeff] hover:bg-[#1c1b3a] transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        title="Gerar a capa a partir de um quadro da VSL"
                      >
                        {generatingPoster === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        Gerar capa
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(offer)}
                      className="p-2 rounded-lg bg-[#13122b] text-[#a8aeff] hover:bg-[#1c1b3a] transition-all cursor-pointer"
                      title="Editar oferta / atualizar escala"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      title="Excluir Oferta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Offer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-[#0b0a1f] border border-[#6b76ff] w-full max-w-3xl rounded-2xl p-4 sm:p-6 space-y-6 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#25244a] pb-4">
              <h3 className="text-base sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                {editingId ? 'Editar Oferta' : `Cadastrar Novas Ofertas (até ${BATCH_SIZE})`}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#6b76ff]/10 text-[#a8aeff] border border-[#6b76ff]">
                  Bucket: {R2_BUCKET}
                </span>
              </h3>
              <button
                onClick={() => {
                  if (isUploading && !confirm('Há uploads em andamento. Fechar agora cancela o cadastro. Fechar mesmo assim?')) return;
                  setShowModal(false);
                }}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ABAS: uma oferta por aba */}
            {!editingId && (
              <div className="flex gap-2 p-1 rounded-full bg-white/5 border border-white/10">
                {drafts.map((d, i) => {
                  const active = i === activeDraft;
                  const busy = uploadingIn(i);
                  return (
                    <button
                      key={d.folder}
                      type="button"
                      onClick={() => { setActiveDraft(i); setScaleAds(''); }}
                      className={`flex-1 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        active ? 'bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white shadow-lg' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : hasContent(d.form) ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : null}
                      <span className="truncate">{d.form.name.trim() || `Oferta ${i + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 text-sm">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Nome da Oferta</label>
                <input
                  type="text"
                  placeholder="Ex: Oferta Especial VSL 4K"
                  className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-4 py-3 text-white focus:border-[#6b76ff] outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Nicho</label>
                  <select
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-4 py-3 text-white focus:border-[#6b76ff] outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Qualidade da VSL</label>
                  <select
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-4 py-3 text-white focus:border-[#6b76ff] outline-none"
                    value={formData.vslResolution}
                    onChange={(e) => setFormData({ ...formData, vslResolution: e.target.value })}
                  >
                    <option>4K Ultra HD</option>
                    <option>1080p Full HD</option>
                    <option>720p HD</option>
                  </select>
                </div>
              </div>

              {/* DADOS USADOS NOS FILTROS DA ÁREA DE MEMBROS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Tipo (Low/Mid/High Ticket)', key: 'ticketType' as const, options: TICKET_TYPES },
                  { label: 'Rede de tráfego', key: 'network' as const, options: NETWORKS },
                  { label: 'Estrutura', key: 'structure' as const, options: STRUCTURES },
                  { label: 'Tipo de produto', key: 'productType' as const, options: PRODUCT_TYPES },
                  { label: 'Idioma', key: 'language' as const, options: LANGUAGES },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-gray-300 mb-1 font-semibold text-xs">{field.label}</label>
                    <select
                      className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-3 py-2.5 text-white focus:border-[#6b76ff] outline-none text-xs"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    >
                      {field.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">Rodando desde</label>
                  <input
                    type="date"
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                    value={formData.startedAt}
                    onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Descrição do Produto</label>
                <textarea
                  rows={2}
                  placeholder="Resumo da oferta..."
                  className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-4 py-3 text-white focus:border-[#6b76ff] outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Transcrição da VSL <span className="text-xs text-gray-500 font-normal">(opcional)</span></label>
                <textarea
                  rows={4}
                  placeholder="Cole aqui o texto da VSL. Os membros podem ler e baixar."
                  className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-4 py-3 text-white focus:border-[#6b76ff] outline-none text-xs"
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                />
              </div>

              {/* MÍDIAS DA OFERTA NO CLOUDFLARE R2 */}
              <div className="p-4 rounded-xl bg-[#13122b] border border-[#25244a] space-y-4">
                <h4 className="font-extrabold text-[#a8aeff] flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Film className="w-4 h-4" />
                  Mídias da Oferta (Cloudflare R2)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VSL */}
                  <div className="p-4 rounded-xl bg-[#0b0a1f] border border-[#25244a] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">🎥 Vídeo da VSL (original)</span>
                    <input
                      type="file"
                      id="vsl-upload-input"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleVslUpload(e.target.files[0])}
                    />
                    <label
                      htmlFor="vsl-upload-input"
                      className="cursor-pointer border border-dashed border-[#6b76ff]/50 rounded-xl p-3 text-center block hover:bg-[#6b76ff]/10 transition-all"
                    >
                      <UploadCloud className="w-6 h-6 text-[#6b76ff] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('vsl', 'Selecionar vídeo da VSL')}</span>
                    </label>
                    {formData.vslFileName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{formData.vslFileName}</span>
                      </div>
                    )}
                  </div>

                  {/* CAPA */}
                  <div className="p-4 rounded-xl bg-[#0b0a1f] border border-[#25244a] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">🖼️ Capa da VSL (imagem)</span>
                    <input
                      type="file"
                      id="poster-upload-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePosterUpload(e.target.files[0])}
                    />
                    <label
                      htmlFor="poster-upload-input"
                      className="cursor-pointer border border-dashed border-[#6b76ff]/50 rounded-xl p-3 text-center block hover:bg-[#6b76ff]/10 transition-all"
                    >
                      <ImageIcon className="w-6 h-6 text-[#6b76ff] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('poster', 'Selecionar imagem (opcional: sem ela, a capa sai da VSL)')}</span>
                    </label>
                    {formData.posterKey && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">Capa enviada</span>
                      </div>
                    )}
                  </div>

                  {/* CRIATIVOS DOS ANÚNCIOS (BIBLIOTECA DO META): VÍDEOS E IMAGENS */}
                  <div className="p-4 rounded-xl bg-[#0b0a1f] border border-[#25244a] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">🎬 Criativos dos anúncios — vídeos e imagens (Biblioteca do Meta Ads)</span>
                    <input
                      type="file"
                      id="ads-upload-input"
                      accept="video/*,image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && e.target.files.length > 0 && handleAdVideosUpload(e.target.files)}
                    />
                    <label
                      htmlFor="ads-upload-input"
                      className="cursor-pointer border border-dashed border-[#6b76ff]/50 rounded-xl p-3 text-center block hover:bg-[#6b76ff]/10 transition-all"
                    >
                      <Video className="w-6 h-6 text-[#6b76ff] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('ads', 'Selecionar vídeos e imagens (vários)')}</span>
                    </label>
                    {formData.adVideos.map((ad) => (
                      <div key={ad.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-semibold">
                        <span className="truncate flex items-center gap-1.5">
                          {isImageCreative(ad) ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <Video className="w-3.5 h-3.5 shrink-0" />}
                          {ad.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, adVideos: prev.adVideos.filter((v) => v.key !== ad.key) }))}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* PACK DE CRIATIVOS */}
                  <div className="p-4 rounded-xl bg-[#0b0a1f] border border-[#25244a] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">📦 Pack de criativos (ZIP)</span>
                    <input
                      type="file"
                      id="creative-upload-input"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCreativeUpload(e.target.files[0])}
                    />
                    <label
                      htmlFor="creative-upload-input"
                      className="cursor-pointer border border-dashed border-[#6b76ff]/50 rounded-xl p-3 text-center block hover:bg-[#6b76ff]/10 transition-all"
                    >
                      <Package className="w-6 h-6 text-[#6b76ff] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('creative', 'Selecionar pack')}</span>
                    </label>
                    {formData.creativeFileName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{formData.creativeFileName} ({formData.creativeFileSize})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* URLS DA OFERTA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Site Oficial</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Landing Page</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                    value={formData.landingPageUrl}
                    onChange={(e) => setFormData({ ...formData, landingPageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Biblioteca de Anúncios</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/ads/library/..."
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                    value={formData.adsLibraryUrl}
                    onChange={(e) => setFormData({ ...formData, adsLibraryUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* GRÁFICO DE ESCALA POR DIA */}
              <div className="p-4 rounded-xl bg-[#13122b] border border-[#25244a] space-y-4">
                <h4 className="font-extrabold text-[#a8aeff] flex items-center gap-2 text-sm uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4" />
                  Escala por dia (anúncios ativos na Biblioteca do Meta)
                </h4>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold text-xs">Dia</label>
                    <input
                      type="date"
                      className="bg-[#0b0a1f] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                      value={scaleDate}
                      onChange={(e) => setScaleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold text-xs">Anúncios ativos</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ex: 42"
                      className="w-32 bg-[#0b0a1f] border border-[#25244a] rounded-xl px-3 py-2 text-white focus:border-[#6b76ff] outline-none text-xs"
                      value={scaleAds}
                      onChange={(e) => setScaleAds(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addScalePoint}
                    className="px-4 py-2 rounded-xl bg-[#0b0a1f] border border-[#6b76ff]/50 text-[#a8aeff] text-xs font-bold hover:bg-[#6b76ff]/10 cursor-pointer"
                  >
                    Adicionar dia
                  </button>
                </div>

                <ScaleChart data={formData.dailyScale} height={180} />

                {formData.dailyScale.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.dailyScale.map((p) => (
                      <span key={p.date} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b0a1f] border border-[#25244a] text-[11px] text-gray-300">
                        {p.date.split('-').reverse().join('/')}: <strong className="text-white">{p.ads}</strong>
                        <button type="button" onClick={() => removeScalePoint(p.date)} className="text-red-400 hover:text-red-300 cursor-pointer" title="Remover dia">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#25244a]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-bold shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUploading ? 'Aguarde os uploads...' : editingId ? 'Salvar Oferta' : `Salvar ${filledCount || ''} oferta${filledCount === 1 ? '' : 's'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
