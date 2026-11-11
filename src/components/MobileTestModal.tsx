import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Download,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface MobileTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId?: string | null;
}

export const MobileTestModal: React.FC<MobileTestModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
}) => {
  // URLs para teste no telemóvel
  const baseSharedUrl = 'https://ais-pre-7wy5wuqpjlmkar54ngwwlg-655174525355.europe-west3.run.app';
  const baseDevUrl =
    typeof window !== 'undefined' && window.location.origin.includes('run.app')
      ? window.location.origin
      : 'https://ais-dev-7wy5wuqpjlmkar54ngwwlg-655174525355.europe-west3.run.app';

  const [activeUrlType, setActiveUrlType] = useState<'shared' | 'dev'>('shared');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>('ios');

  const selectedBaseUrl = activeUrlType === 'shared' ? baseSharedUrl : baseDevUrl;
  const currentUrl = spreadsheetId
    ? `${selectedBaseUrl}#sheetId=${encodeURIComponent(spreadsheetId)}`
    : selectedBaseUrl;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Erro ao gerar código QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Erro ao copiar link:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in p-0 sm:p-4">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">Testar no Telemóvel</h2>
              <p className="text-[11px] text-slate-300">Aceda à aplicação no seu smartphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Seletor do Tipo de URL */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveUrlType('shared')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeUrlType === 'shared'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Link de Partilha (Recomendado)</span>
            </button>
            <button
              onClick={() => setActiveUrlType('dev')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeUrlType === 'dev'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Ambiente Dev</span>
            </button>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Código QR para abrir no telemóvel"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-400">
                  A carregar código QR...
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Aponte a câmara do seu telemóvel para o código QR
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Não necessita de instalar nenhuma aplicação leitora de QR
              </p>
            </div>

            {/* Input e Botão de Copiar */}
            <div className="w-full flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Dicas de Instalação no Ecrã Principal (PWA) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Instalar como App no Telemóvel</span>
              </h3>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActivePlatformTab('ios')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    activePlatformTab === 'ios'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  iPhone (iOS)
                </button>
                <button
                  onClick={() => setActivePlatformTab('android')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    activePlatformTab === 'android'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Android
                </button>
              </div>
            </div>

            {activePlatformTab === 'ios' ? (
              <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800">Passos no Safari (iPhone / iPad):</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>
                    Abra o link no navegador <strong>Safari</strong>.
                  </li>
                  <li>
                    Toque no botão <strong>Partilhar</strong> (ícone com quadrado e seta para cima).
                  </li>
                  <li>
                    Desça na lista e selecione <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong>.
                  </li>
                  <li>
                    Toque em <strong>Adicionar</strong> no canto superior direito.
                  </li>
                </ol>
                <p className="text-[10px] text-amber-700 font-medium pt-1">
                  ✓ Abrirá em ecrã completo sem a barra de endereços do navegador!
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800">Passos no Google Chrome (Android):</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>
                    Abra o link no <strong>Chrome</strong>.
                  </li>
                  <li>
                    Toque no menu de <strong>3 pontos</strong> ⋮ no canto superior direito.
                  </li>
                  <li>
                    Selecione <strong>&quot;Instalar aplicação&quot;</strong> ou <strong>&quot;Adicionar ao ecrã inicial&quot;</strong>.
                  </li>
                  <li>
                    Confirme em <strong>Instalar</strong>.
                  </li>
                </ol>
                <p className="text-[10px] text-emerald-700 font-medium pt-1">
                  ✓ Fica disponível como ícone na gaveta de aplicações do telemóvel!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            <span>Abrir noutro separador</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer min-h-[38px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
