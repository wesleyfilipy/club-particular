import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileVideo, HardDrive, Play, Trash2, Folder, ShieldCheck } from 'lucide-react';
import { uploadToR2, R2_BUCKET } from '../services/r2';

export const MediaUploader: React.FC = () => {
  const [selectedOffer, setSelectedOffer] = useState('oferta-001');
  const [fileCategory, setFileCategory] = useState<'vsl' | 'creatives' | 'facebook-videos' | 'pdf' | 'ebooks' | 'bonus'>('vsl');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'principal.mp4', key: 'offers/oferta-001/vsl/principal.mp4', size: '1.2 GB', category: 'vsl', date: '27/07/2026' },
    { name: 'pack-banner.zip', key: 'offers/oferta-001/creatives/pack-banner.zip', size: '145 MB', category: 'creatives', date: '27/07/2026' },
    { name: 'ad-facebook-01.mp4', key: 'offers/oferta-001/facebook-videos/ad-facebook-01.mp4', size: '650 MB', category: 'facebook-videos', date: '26/07/2026' },
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    setUploading(true);
    setProgress(10);
    const keyPath = `offers/${selectedOffer}/${fileCategory}/${file.name}`;

    try {
      // Simulate real-time progress increments
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      await uploadToR2(file, keyPath, file.type || 'application/octet-stream');
      clearInterval(progressInterval);
      setProgress(100);

      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size > 1024 * 1024 * 1024 ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB` : `${fileSizeMb} MB`;

      setUploadedFiles((prev) => [
        {
          name: file.name,
          key: keyPath,
          size: displaySize,
          category: fileCategory,
          date: new Date().toLocaleDateString('pt-BR'),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed uploading to Cloudflare R2:', err);
    } finally {
      setTimeout(() => setUploading(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            Central Cloudflare R2 S3 Storage
            <span className="text-xs px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#e8c766] border border-[#d4af37]">
              Bucket: {R2_BUCKET}
            </span>
          </h2>
          <p className="text-sm text-gray-400">
            Upload direto para o Cloudflare R2 com URLs temporárias (Signed URLs) liberadas via Supabase + Lastlink.
          </p>
        </div>
      </div>

      {/* Offer & Folder Selection Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0e0d0b] p-6 rounded-lg border border-[#2c2818]">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">1. SELECIONAR OFERTA</label>
          <select
            className="w-full bg-[#17150f] border border-[#2c2818] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
            value={selectedOffer}
            onChange={(e) => setSelectedOffer(e.target.value)}
          >
            <option value="oferta-001">Fórmula Seca Barriga Natural 3.0 (oferta-001)</option>
            <option value="oferta-002">Método Milionário com IA (oferta-002)</option>
            <option value="oferta-003">Código Secreto Sedução (oferta-003)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">2. PASTA DE DESTINO (ESTRUTURA R2)</label>
          <select
            className="w-full bg-[#17150f] border border-[#2c2818] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] outline-none"
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value as any)}
          >
            <option value="vsl">🎥 /vsl/ (Vídeo de Vendas Original 4K/1080p)</option>
            <option value="creatives">📦 /creatives/ (Banners, Packs Canva, ZIP)</option>
            <option value="facebook-videos">🎬 /facebook-videos/ (Vídeos Anúncios Facebook)</option>
            <option value="pdf">📄 /pdf/ (Documentos & Guias)</option>
            <option value="ebooks">📚 /ebooks/ (Ebooks & Materiais)</option>
            <option value="bonus">🎁 /bonus/ (Arquivos Bônus)</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          dragActive ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-[#2c2818] bg-[#0e0d0b] hover:border-[#d4af37]/50'
        }`}
      >
        <input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} />
        <label htmlFor="file-upload" className="cursor-pointer space-y-4 inline-block">
          <div className="w-16 h-16 rounded-full bg-[#17150f] border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Arraste seus ficheiros para o Cloudflare R2</h4>
            <p className="text-xs text-gray-400 mt-1">
              Caminho R2 automático: <span className="text-[#e8c766] font-mono">offers/{selectedOffer}/{fileCategory}/[nome-do-ficheiro]</span>
            </p>
          </div>
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black font-bold text-sm shadow-lg"
          >
            Fazer Upload para R2
          </button>
        </label>
      </div>

      {/* Progress Indicator */}
      {uploading && (
        <div className="bg-[#0e0d0b] border border-[#d4af37] p-6 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-white flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-[#d4af37]" />
              Enviando arquivo diretamente para o Cloudflare R2 S3...
            </span>
            <span className="font-bold text-[#e8c766]">{progress}%</span>
          </div>
          <div className="w-full bg-[#17150f] h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* R2 Uploaded Files List */}
      <div className="bg-[#0e0d0b] rounded-lg border border-[#2c2818] p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#d4af37]" />
          Arquivos no Bucket Cloudflare R2 (club-particular)
        </h3>

        <div className="space-y-2">
          {uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl bg-[#17150f] border border-[#2c2818] hover:border-[#d4af37]/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0e0d0b] border border-[#2c2818] flex items-center justify-center text-[#d4af37]">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">{file.name}</h5>
                  <p className="text-xs text-gray-400 font-mono">
                    R2 Key: <span className="text-[#e8c766]">{file.key}</span> • {file.size}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  R2 Signed URL Protegida
                </span>
                <button
                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
