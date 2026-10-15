import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UploadCloud, Film, Package, CheckCircle2, Image as ImageIcon, Video, X, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { uploadToR2, R2_BUCKET, slugify } from '../services/r2';
import {
  OfferItem,
  OfferInput,
  ScalePoint,
  fetchOffersFromSupabase,
  createOffer,
  updateOffer,
  deleteOffer,
} from '../services/offersService';
import { ScaleChart } from '../components/ScaleChart';

const CATEGORIES = [
  'Saúde & Emagrecimento',
  'Renda Extra & Finanças',
  'Desenvolvimento Pessoal',
  'Relacionamento & Conquista',
  'Investimentos & Cripto',
  'E-commerce & Dropshipping',
];

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
});

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 * 1024
    ? `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const today = () => new Date().toISOString().slice(0, 10);

type UploadSlot = 'vsl' | 'poster' | 'ads' | 'creative';

export const OffersManager: React.FC = () => {
  const [offersList, setOffersList] = useState<OfferItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [folder, setFolder] = useState('');
  const [formData, setFormData] = useState<OfferInput>(emptyForm);
  const [uploads, setUploads] = useState<Partial<Record<UploadSlot, number>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scaleDate, setScaleDate] = useState(today());
  const [scaleAds, setScaleAds] = useState('');

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
    setFolder(`oferta-${Date.now()}`);
    setFormData(emptyForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (offer: OfferItem) => {
    const { id, ...rest } = offer;
    setEditingId(id);
    setFolder(id);
    setFormData(rest);
    setError('');
    setShowModal(true);
  };

  const isUploading = Object.keys(uploads).length > 0;

  // Envia um arquivo para offers/<pasta-da-oferta>/<subpasta>/<arquivo> no Cloudflare R2
  const uploadFile = async (slot: UploadSlot, subfolder: string, file: File) => {
    const keyPath = `offers/${folder}/${subfolder}/${Date.now()}-${slugify(file.name)}`;
    setError('');
    setUploads((prev) => ({ ...prev, [slot]: 0 }));
    try {
      await uploadToR2(file, keyPath, file.type || 'application/octet-stream', (percent) =>
        setUploads((prev) => ({ ...prev, [slot]: percent }))
      );
      return keyPath;
    } catch (err: any) {
      setError(err.message || 'Erro no upload para o Cloudflare R2.');
      return null;
    } finally {
      setUploads((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    }
  };

  const handleVslUpload = async (file: File) => {
    const key = await uploadFile('vsl', 'vsl', file);
    if (key) setFormData((prev) => ({ ...prev, vslKey: key, vslFileName: file.name }));
  };

  const handlePosterUpload = async (file: File) => {
    const key = await uploadFile('poster', 'poster', file);
    if (key) setFormData((prev) => ({ ...prev, posterKey: key }));
  };

  const handleAdVideosUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const key = await uploadFile('ads', 'ad-videos', file);
      if (key) setFormData((prev) => ({ ...prev, adVideos: [...prev.adVideos, { key, name: file.name }] }));
    }
  };

  const handleCreativeUpload = async (file: File) => {
    const key = await uploadFile('creative', 'creatives', file);
    if (key) {
      setFormData((prev) => ({
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
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updated = await updateOffer(editingId, formData);
        setOffersList((prev) => prev.map((o) => (o.id === editingId ? updated : o)));
      } else {
        const created = await createOffer(formData);
        setOffersList((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(`Erro ao salvar no Supabase: ${err.message}`);
    } finally {
      setSaving(false);
    }
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

  const uploadLabel = (slot: UploadSlot, idle: string) =>
    uploads[slot] !== undefined ? `Enviando... ${uploads[slot]}%` : idle;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Gerenciamento de Ofertas</h2>
          <p className="text-sm text-gray-400">
            VSLs, vídeos dos anúncios e packs vão direto para o Cloudflare R2. Os dados da oferta e o gráfico de escala ficam no Supabase.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-sm shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Nova Oferta
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-[#12141d] rounded-2xl border border-[#282c3d] overflow-x-auto shadow-2xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1d29] text-xs font-bold text-[#f5d77f] uppercase border-b border-[#282c3d]">
            <tr>
              <th className="p-4">Nome da Oferta</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">VSL (R2)</th>
              <th className="p-4">Vídeos de Anúncios</th>
              <th className="p-4">Escala (hoje)</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282c3d]">
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
              <tr key={offer.id} className="hover:bg-[#1a1d29]/50 transition-all">
                <td className="p-4 font-bold text-white">{offer.name}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-[#1a1d29] border border-[#282c3d] text-xs font-medium text-gray-300">
                    {offer.category}
                  </span>
                </td>
                <td className="p-4">
                  {offer.vslFileName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      {offer.vslFileName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Sem VSL</span>
                  )}
                </td>
                <td className="p-4 text-xs font-semibold">{offer.adVideos.length} vídeo{offer.adVideos.length === 1 ? '' : 's'}</td>
                <td className="p-4 text-xs font-semibold">
                  {offer.dailyScale.length > 0 ? `${offer.dailyScale[offer.dailyScale.length - 1].ads} anúncios` : '—'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(offer)}
                      className="p-2 rounded-lg bg-[#1a1d29] text-[#f5d77f] hover:bg-[#222736] transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#12141d] border border-[#d4af37] w-full max-w-3xl rounded-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282c3d] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingId ? 'Editar Oferta' : 'Cadastrar Nova Oferta'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#f5d77f] border border-[#d4af37]">
                  Bucket: {R2_BUCKET}
                </span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  required
                  placeholder="Ex: Oferta Especial VSL 4K"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Categoria</label>
                  <select
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Comissão</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 80% (R$ 180,00)"
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Qualidade da VSL</label>
                  <select
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                    value={formData.vslResolution}
                    onChange={(e) => setFormData({ ...formData, vslResolution: e.target.value })}
                  >
                    <option>4K Ultra HD</option>
                    <option>1080p Full HD</option>
                    <option>720p HD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Descrição do Produto</label>
                <textarea
                  rows={2}
                  placeholder="Resumo da oferta..."
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* MÍDIAS DA OFERTA NO CLOUDFLARE R2 */}
              <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d] space-y-4">
                <h4 className="font-extrabold text-[#f5d77f] flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Film className="w-4 h-4" />
                  Mídias da Oferta (Cloudflare R2)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VSL */}
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
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
                      className="cursor-pointer border border-dashed border-[#d4af37]/50 rounded-xl p-3 text-center block hover:bg-[#d4af37]/10 transition-all"
                    >
                      <UploadCloud className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
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
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
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
                      className="cursor-pointer border border-dashed border-[#d4af37]/50 rounded-xl p-3 text-center block hover:bg-[#d4af37]/10 transition-all"
                    >
                      <ImageIcon className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('poster', 'Selecionar imagem de capa')}</span>
                    </label>
                    {formData.posterKey && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">Capa enviada</span>
                      </div>
                    )}
                  </div>

                  {/* VÍDEOS DOS ANÚNCIOS (BIBLIOTECA DO META) */}
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">🎬 Vídeos dos anúncios (Biblioteca do Meta Ads)</span>
                    <input
                      type="file"
                      id="ads-upload-input"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && e.target.files.length > 0 && handleAdVideosUpload(e.target.files)}
                    />
                    <label
                      htmlFor="ads-upload-input"
                      className="cursor-pointer border border-dashed border-[#d4af37]/50 rounded-xl p-3 text-center block hover:bg-[#d4af37]/10 transition-all"
                    >
                      <Video className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">{uploadLabel('ads', 'Selecionar vídeos (vários)')}</span>
                    </label>
                    {formData.adVideos.map((ad) => (
                      <div key={ad.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-semibold">
                        <span className="truncate">{ad.name}</span>
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
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
                    <span className="block font-bold text-xs text-gray-300">📦 Pack de criativos (ZIP)</span>
                    <input
                      type="file"
                      id="creative-upload-input"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCreativeUpload(e.target.files[0])}
                    />
                    <label
                      htmlFor="creative-upload-input"
                      className="cursor-pointer border border-dashed border-[#d4af37]/50 rounded-xl p-3 text-center block hover:bg-[#d4af37]/10 transition-all"
                    >
                      <Package className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Site Oficial</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Landing Page</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
                    value={formData.landingPageUrl}
                    onChange={(e) => setFormData({ ...formData, landingPageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Biblioteca de Anúncios</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/ads/library/..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
                    value={formData.adsLibraryUrl}
                    onChange={(e) => setFormData({ ...formData, adsLibraryUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* GRÁFICO DE ESCALA POR DIA */}
              <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d] space-y-4">
                <h4 className="font-extrabold text-[#f5d77f] flex items-center gap-2 text-sm uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4" />
                  Escala por dia (anúncios ativos na Biblioteca do Meta)
                </h4>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold text-xs">Dia</label>
                    <input
                      type="date"
                      className="bg-[#12141d] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
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
                      className="w-32 bg-[#12141d] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
                      value={scaleAds}
                      onChange={(e) => setScaleAds(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addScalePoint}
                    className="px-4 py-2 rounded-xl bg-[#12141d] border border-[#d4af37]/50 text-[#f5d77f] text-xs font-bold hover:bg-[#d4af37]/10 cursor-pointer"
                  >
                    Adicionar dia
                  </button>
                </div>

                <ScaleChart data={formData.dailyScale} height={180} />

                {formData.dailyScale.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.dailyScale.map((p) => (
                      <span key={p.date} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12141d] border border-[#282c3d] text-[11px] text-gray-300">
                        {p.date.split('-').reverse().join('/')}: <strong className="text-white">{p.ads}</strong>
                        <button type="button" onClick={() => removeScalePoint(p.date)} className="text-red-400 hover:text-red-300 cursor-pointer" title="Remover dia">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#282c3d]">
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUploading ? 'Aguarde o upload...' : 'Salvar Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
