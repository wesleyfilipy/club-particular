import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, FileText, UploadCloud, Film, Package, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { uploadToR2, R2_BUCKET } from '../services/r2';
import { OfferItem, getStoredOffers, saveStoredOffers, fetchOffersFromSupabase } from '../services/offersService';
import { supabase } from '../services/supabase';

export const OffersManager: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [uploadingVsl, setUploadingVsl] = useState(false);
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const [vslProgress, setVslProgress] = useState(0);
  const [creativeProgress, setCreativeProgress] = useState(0);

  const [offersList, setOffersList] = useState<OfferItem[]>(() => getStoredOffers());

  // Carrega ofertas do Supabase / LocalStorage
  useEffect(() => {
    const loadOffers = async () => {
      const data = await fetchOffersFromSupabase();
      if (data && data.length > 0) {
        setOffersList(data);
      }
    };
    loadOffers();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Saúde & Emagrecimento',
    commission: '',
    description: '',
    siteUrl: '',
    landingPageUrl: '',
    adsLibraryUrl: '',
    vslFileUrl: '',
    vslFileName: '',
    creativeFileUrl: '',
    creativeFileName: '',
  });

  const handleVslUpload = async (file: File) => {
    setUploadingVsl(true);
    setVslProgress(15);
    const offerCode = formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `oferta-${Date.now()}`;
    const keyPath = `offers/${offerCode}/vsl/${file.name}`;

    try {
      const interval = setInterval(() => {
        setVslProgress((prev) => (prev < 90 ? prev + 20 : prev));
      }, 250);

      await uploadToR2(file, keyPath, file.type || 'video/mp4');
      clearInterval(interval);
      setVslProgress(100);

      setFormData((prev) => ({
        ...prev,
        vslFileUrl: keyPath,
        vslFileName: file.name,
      }));
    } catch (err) {
      console.error('Erro no upload da VSL para o R2:', err);
    } finally {
      setTimeout(() => setUploadingVsl(false), 1000);
    }
  };

  const handleCreativeUpload = async (file: File) => {
    setUploadingCreative(true);
    setCreativeProgress(15);
    const offerCode = formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `oferta-${Date.now()}`;
    const keyPath = `offers/${offerCode}/creatives/${file.name}`;

    try {
      const interval = setInterval(() => {
        setCreativeProgress((prev) => (prev < 90 ? prev + 20 : prev));
      }, 250);

      await uploadToR2(file, keyPath, file.type || 'video/mp4');
      clearInterval(interval);
      setCreativeProgress(100);

      setFormData((prev) => ({
        ...prev,
        creativeFileUrl: keyPath,
        creativeFileName: file.name,
      }));
    } catch (err) {
      console.error('Erro no upload dos Criativos para o R2:', err);
    } finally {
      setTimeout(() => setUploadingCreative(false), 1000);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: OfferItem = {
      id: `oferta-${Date.now()}`,
      name: formData.name || 'Nova Oferta VIP',
      category: formData.category,
      commission: formData.commission || '80% (R$ 180,00 por venda)',
      description: formData.description || 'Oferta exclusiva adicionada pelo administrador com material completo no R2.',
      vslVideoUrl: formData.vslFileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      vslPoster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
      vslFileName: formData.vslFileName || 'vsl_video_oficial_4k.mp4',
      vslResolution: '4K Ultra HD',
      creativeFileName: formData.creativeFileName || 'pack_anuncios_criativos.zip',
      creativeFileSize: '180 MB',
      siteUrl: formData.siteUrl || 'https://clubparticular.com',
      landingPageUrl: formData.landingPageUrl || 'https://clubparticular.com',
      adsLibraryUrl: formData.adsLibraryUrl || 'https://facebook.com/ads/library',
      conversionRate: '8.7%',
      viewsCount: '1.200',
    };

    const updated = [newOffer, ...offersList];
    setOffersList(updated);
    saveStoredOffers(updated);

    // Grava também no Supabase
    try {
      await supabase.from('offers').insert([
        {
          id: newOffer.id,
          name: newOffer.name,
          category: newOffer.category,
          commission: newOffer.commission,
          description: newOffer.description,
          image_url: newOffer.vslVideoUrl,
          logo_url: newOffer.vslPoster,
          official_site_url: newOffer.siteUrl,
          landing_page_url: newOffer.landingPageUrl,
          facebook_ads_library_url: newOffer.adsLibraryUrl,
        },
      ]);
    } catch (err) {
      console.warn('Erro ao inserir no Supabase, salvo localmente:', err);
    }

    setShowModal(false);
    setFormData({
      name: '',
      category: 'Saúde & Emagrecimento',
      commission: '',
      description: '',
      siteUrl: '',
      landingPageUrl: '',
      adsLibraryUrl: '',
      vslFileUrl: '',
      vslFileName: '',
      creativeFileUrl: '',
      creativeFileName: '',
    });
  };

  const handleDelete = async (id: string) => {
    const updated = offersList.filter((o) => o.id !== id);
    setOffersList(updated);
    saveStoredOffers(updated);

    try {
      await supabase.from('offers').delete().eq('id', id);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Gerenciamento de Ofertas VIP</h2>
          <p className="text-sm text-gray-400">
            Adicione ofertas com upload direto de vídeos de VSL e anúncios no Cloudflare R2. Todas as ofertas aqui ficam visíveis no menu do Aluno!
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-sm shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Nova Oferta VIP
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-[#12141d] rounded-2xl border border-[#282c3d] overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1d29] text-xs font-bold text-[#f5d77f] uppercase border-b border-[#282c3d]">
            <tr>
              <th className="p-4">Nome da Oferta</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Comissão VIP</th>
              <th className="p-4">Vídeo VSL (R2)</th>
              <th className="p-4">Anúncios / Pack R2</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282c3d]">
            {offersList.map((offer) => (
              <tr key={offer.id} className="hover:bg-[#1a1d29]/50 transition-all">
                <td className="p-4 font-bold text-white">{offer.name}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-[#1a1d29] border border-[#282c3d] text-xs font-medium text-gray-300">
                    {offer.category}
                  </span>
                </td>
                <td className="p-4 font-bold text-[#d4af37]">{offer.commission}</td>
                <td className="p-4">
                  {offer.vslFileName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      {offer.vslFileName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Sem VSL anexada</span>
                  )}
                </td>
                <td className="p-4">
                  {offer.creativeFileName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold">
                      <Package className="w-3.5 h-3.5" />
                      {offer.creativeFileName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Sem criativos anexados</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDelete(offer.id)}
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
                Cadastrar Nova Oferta VIP
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#f5d77f] border border-[#d4af37]">
                  Bucket: {R2_BUCKET}
                </span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white font-bold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-5 text-sm">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Categoria</label>
                  <select
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Saúde & Emagrecimento</option>
                    <option>Renda Extra & Finanças</option>
                    <option>Desenvolvimento Pessoal</option>
                    <option>Relacionamento & Conquista</option>
                    <option>Investimentos & Cripto</option>
                    <option>E-commerce & Dropshipping</option>
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

              {/* MÍDIAS DA OFERTA (VSL & ANÚNCIOS R2) */}
              <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d] space-y-4">
                <h4 className="font-extrabold text-[#f5d77f] flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Film className="w-4 h-4" />
                  Mídias da Oferta (Cloudflare R2 Direct Upload)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPLOAD VSL */}
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
                    <label className="block font-bold text-xs text-gray-300">
                      🎥 Vídeo de VSL (Original 4K/1080p)
                    </label>
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
                      <span className="text-xs font-semibold text-gray-300 block">
                        {uploadingVsl ? `Enviando VSL... ${vslProgress}%` : 'Selecionar Vídeo de VSL para R2'}
                      </span>
                      <span className="text-[10px] text-gray-500 block">Salva em /vsl/[nome-do-arquivo]</span>
                    </label>

                    {formData.vslFileName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{formData.vslFileName}</span>
                      </div>
                    )}
                  </div>

                  {/* UPLOAD CRIATIVOS E VÍDEOS DE ANÚNCIOS */}
                  <div className="p-4 rounded-xl bg-[#12141d] border border-[#282c3d] space-y-3">
                    <label className="block font-bold text-xs text-gray-300">
                      🎬 Vídeos de Anúncios / Criativos (Pack Canva / ZIP)
                    </label>
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
                      <UploadCloud className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-gray-300 block">
                        {uploadingCreative ? `Enviando Criativos... ${creativeProgress}%` : 'Selecionar Anúncios / Pack para R2'}
                      </span>
                      <span className="text-[10px] text-gray-500 block">Salva em /creatives/[nome-do-arquivo]</span>
                    </label>

                    {formData.creativeFileName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="truncate">{formData.creativeFileName}</span>
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
                  <label className="block text-gray-300 mb-1 font-semibold text-xs">URL Ads Library</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/ads..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none text-xs"
                    value={formData.adsLibraryUrl}
                    onChange={(e) => setFormData({ ...formData, adsLibraryUrl: e.target.value })}
                  />
                </div>
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold shadow-lg cursor-pointer"
                >
                  Salvar Oferta no Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
