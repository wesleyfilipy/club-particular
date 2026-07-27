import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Video, Globe, FileText, CheckCircle } from 'lucide-react';

export const OffersManager: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [offersList, setOffersList] = useState([
    {
      id: 'o1',
      name: 'Fórmula Seca Barriga Natural 3.0',
      category: 'Saúde & Emagrecimento',
      commission: '80% (R$ 157,60)',
      siteUrl: 'https://formulaseca.com.br',
      landingPageUrl: 'https://formulaseca.com.br/pv-oficial',
      adsLibraryUrl: 'https://facebook.com/ads/library',
    },
    {
      id: 'o2',
      name: 'Método Milionário com IA (MMIA)',
      category: 'Renda Extra & Finanças',
      commission: '75% (R$ 222,75)',
      siteUrl: 'https://metodomilionarioia.com',
      landingPageUrl: 'https://metodomilionarioia.com/vsl-full',
      adsLibraryUrl: 'https://facebook.com/ads/library',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Saúde & Emagrecimento',
    commission: '',
    description: '',
    siteUrl: '',
    landingPageUrl: '',
    adsLibraryUrl: '',
    vslTitle: '',
    vslUrl: '',
    headline: '',
    targetAge: '',
    targetGender: '',
  });

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer = {
      id: `o-${Date.now()}`,
      name: formData.name || 'Nova Oferta VIP',
      category: formData.category,
      commission: formData.commission || '80% (R$ 150,00)',
      siteUrl: formData.siteUrl,
      landingPageUrl: formData.landingPageUrl,
      adsLibraryUrl: formData.adsLibraryUrl,
    };
    setOffersList([...offersList, newOffer]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setOffersList(offersList.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Gerenciamento de Ofertas</h2>
          <p className="text-sm text-gray-400">Adicione, edite ou remova ofertas e mídias sem alterar nenhum código.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-sm shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Adicionar Nova Oferta
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-[#12141d] rounded-2xl border border-[#282c3d] overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1d29] text-xs font-bold text-[#f5d77f] uppercase border-b border-[#282c3d]">
            <tr>
              <th className="p-4">Nome da Oferta</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Comissão</th>
              <th className="p-4">Links Configurados</th>
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
                  <div className="flex items-center gap-2">
                    <span title="Site Configurado" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <span title="Landing Page" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span title="FB Ads Library" className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Video className="w-4 h-4" />
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 rounded-lg bg-[#1a1d29] text-gray-300 hover:text-[#d4af37] transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
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
          <div className="bg-[#12141d] border border-[#d4af37] w-full max-w-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#282c3d] pb-4">
              <h3 className="text-xl font-bold text-white">Cadastrar Nova Oferta VIP</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Nome da Oferta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Método Afiliado Master 4K"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Categoria</label>
                  <select
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Saúde & Emagrecimento</option>
                    <option>Renda Extra & Finanças</option>
                    <option>Desenvolvimento Pessoal</option>
                    <option>Relacionamento & Conquista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Comissão</label>
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
                <label className="block text-gray-400 mb-1 font-semibold">Descrição do Produto</label>
                <textarea
                  rows={3}
                  placeholder="Resumo da oferta..."
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">URL Site Oficial</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none"
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">URL Landing Page</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none"
                    value={formData.landingPageUrl}
                    onChange={(e) => setFormData({ ...formData, landingPageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">URL Ads Library</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/ads..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-3 py-2 text-white focus:border-[#d4af37] outline-none"
                    value={formData.adsLibraryUrl}
                    onChange={(e) => setFormData({ ...formData, adsLibraryUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#282c3d]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold shadow-lg"
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
