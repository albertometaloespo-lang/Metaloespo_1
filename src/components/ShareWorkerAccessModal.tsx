import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Colaborador, GoogleSyncConfig } from '../types';
import { QrCode, Copy, Check, MessageSquare, X, Shield, Smartphone, KeyRound, ExternalLink } from 'lucide-react';

interface ShareWorkerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: Colaborador | null;
  syncConfig: GoogleSyncConfig;
}

export const ShareWorkerAccessModal: React.FC<ShareWorkerAccessModalProps> = ({
  isOpen,
  onClose,
  colaborador,
  syncConfig,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Construir link de acesso direto com hash parameters
  const baseUrl = window.location.origin + window.location.pathname;
  let accessUrl = baseUrl;
  if (colaborador) {
    const params = new URLSearchParams();
    params.set('worker', colaborador.id);
    params.set('pin', colaborador.pin);
    if (syncConfig.spreadsheetId) {
      params.set('sheetId', syncConfig.spreadsheetId);
    }
    accessUrl = `${baseUrl}#${params.toString()}`;
  }

  useEffect(() => {
    if (isOpen && colaborador && accessUrl) {
      QRCode.toDataURL(accessUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code de acesso:', err));
    }
  }, [isOpen, colaborador, accessUrl]);

  if (!isOpen || !colaborador) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${colaborador.nome}!\n\nAqui está o teu link direto para registares as tuas horas diárias na Metaloespo:\n${accessUrl}\n\nO teu PIN pessoal é: *${colaborador.pin}*\n\nBasta abrir no telemóvel e gravar no ecrã principal!`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Acesso Pessoal Móvel</h3>
              <p className="text-xs text-slate-300">Registo exclusivo para {colaborador.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Worker identity card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                style={{ backgroundColor: colaborador.cor }}
              >
                {colaborador.nome.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">
                  {colaborador.nome}
                </h4>
                <p className="text-xs text-slate-500">{colaborador.funcao}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                PIN de Acesso
              </span>
              <span className="font-mono font-extrabold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-xl text-sm border border-amber-300/60 inline-flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-600" />
                {colaborador.pin}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {qrCodeDataUrl ? (
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code para ${colaborador.nome}`}
                  className="w-48 h-48 rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                A gerar código QR...
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 text-center font-medium">
              Apontar a câmara do telemóvel para abrir a aplicação
            </p>
          </div>

          {/* Proteção e Restrição */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <strong>Acesso Restrito Seguro:</strong> Este colaborador apenas poderá registar e consultar as <strong>suas próprias horas</strong>. Não tem permissão para aceder à equipa, relatórios ou definições de administrador.
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar Link por WhatsApp para {colaborador.nome}
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all ${
                copied
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Link Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  Copiar Link Direto para Telemóvel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
