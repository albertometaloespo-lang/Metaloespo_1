import React, { useState } from 'react';
import {
  FileText,
  Cloud,
  Share2,
  Mail,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  MessageSquare,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Colaborador, Obra, RegistoHoras, ValidacaoDia } from '../types';
import { PdfReportService } from '../services/pdfReportService';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { User } from 'firebase/auth';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  colaboradores: Colaborador[];
  obras: Obra[];
  registos: RegistoHoras[];
  validation?: ValidacaoDia;
  user: User | null;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  colaboradores,
  obras,
  registos,
  validation,
  user,
}) => {
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{
    name: string;
    webViewLink: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const fileName = `Ponto_Diario_Metaloespo_${selectedDate}.pdf`;
  const dayRegistos = registos.filter((r) => r.data === selectedDate);
  const totalNormais = dayRegistos.reduce((acc, r) => acc + (r.horasNormais || 0), 0);
  const totalExtra = dayRegistos.reduce((acc, r) => acc + (r.horasExtra || 0), 0);
  const totalGeral = Number((totalNormais + totalExtra).toFixed(1));
  const activeWorkersCount = new Set(dayRegistos.map((r) => r.colaboradorId)).size;
  const activeObrasCount = new Set(dayRegistos.map((r) => r.obraId)).size;

  const getPdfDoc = () => {
    return PdfReportService.generateDailyTimesheetPdf({
      date: selectedDate,
      colaboradores,
      obras,
      registos,
      validation,
    });
  };

  const getPdfBlob = (): Blob => {
    const doc = getPdfDoc();
    return doc.output('blob');
  };

  // 1. DESCARREGAR PDF LOCALMENTE
  const handleDownloadPdf = () => {
    try {
      const doc = getPdfDoc();
      doc.save(fileName);
      setSuccessMessage('Ficheiro PDF descarregado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage('Erro ao descarregar PDF: ' + (err.message || ''));
    }
  };

  // 2. EXPORTAR PARA PASTA NO GOOGLE DRIVE
  const handleExportToGoogleDrive = async () => {
    setIsExportingDrive(true);
    setErrorMessage(null);
    setDriveUploadResult(null);

    try {
      let token = await getAccessToken();

      // Se não houver token em memória, solicitar início de sessão Google
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }

      if (!token) {
        throw new Error('É necessário autorizar a conta Google para guardar na pasta do Drive.');
      }

      const pdfBlob = getPdfBlob();
      const result = await PdfReportService.uploadPdfToGoogleDrive(pdfBlob, fileName, token);

      setDriveUploadResult({
        name: result.name,
        webViewLink: result.webViewLink,
      });
      setSuccessMessage('PDF guardado na pasta "Folhas de Ponto - Metaloespo" do seu Drive!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao enviar para o Google Drive.');
    } finally {
      setIsExportingDrive(false);
    }
  };

  // 3. ENVIAR POR WHATSAPP (Nativo ou Mensagem Estruturada)
  const handleShareWhatsApp = async () => {
    try {
      const pdfBlob = getPdfBlob();
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Se o telemóvel suportar partilha nativa com ficheiro
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Folha de Ponto - ${selectedDate}`,
          text: `Folha de ponto diária da Metaloespo referente ao dia ${selectedDate}. Total: ${totalGeral}h.`,
          files: [pdfFile],
        });
        return;
      }
    } catch (e) {
      console.log('Partilha nativa de ficheiro não disponível ou cancelada, a usar mensagem formatada.');
    }

    // Fallback: Gerar mensagem com link e resumo detalhado para o WhatsApp
    let driveLinkText = '';
    if (driveUploadResult?.webViewLink) {
      driveLinkText = `\n📄 *Link no Google Drive:* ${driveUploadResult.webViewLink}`;
    }

    const lines = [
      `📋 *FOLHA DE PONTO DIÁRIA - METALOESPO*`,
      `📅 *Data:* ${selectedDate}`,
      `⏱ *Total Horas:* ${totalGeral}h (${totalNormais.toFixed(1)}h normais + ${totalExtra.toFixed(1)}h extra)`,
      `👥 *Colaboradores Presentes:* ${activeWorkersCount}`,
      `🏗 *Obras com Trabalho:* ${activeObrasCount}`,
      `🔒 *Estado:* ${validation?.bloqueado ? 'Validado e Fechado' : 'Em Aberto'}`,
      driveLinkText,
      `\n_Gerado pela aplicação móvel ObraTempo da Metaloespo._`,
    ];

    const message = encodeURIComponent(lines.filter(Boolean).join('\n'));
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // 4. ENVIAR POR EMAIL
  const handleShareEmail = async () => {
    try {
      const pdfBlob = getPdfBlob();
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Folha de Ponto Metaloespo - ${selectedDate}`,
          text: `Em anexo envio a folha de ponto da equipa referente a ${selectedDate}.\nTotal de horas: ${totalGeral}h.`,
          files: [pdfFile],
        });
        return;
      }
    } catch (e) {
      console.log('Partilha de email cancelada ou fallback');
    }

    // Fallback mailto
    const subject = encodeURIComponent(`Folha de Ponto Diária Metaloespo - ${selectedDate}`);
    let driveLinkText = '';
    if (driveUploadResult?.webViewLink) {
      driveLinkText = `\nPode aceder ao documento PDF no Google Drive aqui:\n${driveUploadResult.webViewLink}\n`;
    }

    const body = encodeURIComponent(
      `Exmos. Senhores,\n\nSegue o resumo da folha de ponto diária da Metaloespo referente a ${selectedDate}:\n\n` +
        `• Total de Horas: ${totalGeral}h\n` +
        `• Horas Normais: ${totalNormais.toFixed(1)}h\n` +
        `• Horas Suplementares: ${totalExtra.toFixed(1)}h\n` +
        `• Colaboradores Presentes: ${activeWorkersCount}\n` +
        `• Obras Ativas: ${activeObrasCount}\n` +
        `• Estado: ${validation?.bloqueado ? 'Validado pela administração' : 'Em aberto'}\n` +
        driveLinkText +
        `\nCom os melhores cumprimentos,\nMetaloespo`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Exportar Folha de Ponto (PDF)</h3>
              <p className="text-xs text-slate-300">Relatório Oficial Diário da Metaloespo</p>
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
          {/* Cartão de Resumo do Dia a Exportar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Data do Ponto
              </span>
              <span className="text-xs font-extrabold text-slate-900 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {selectedDate}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
              <div className="text-center p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                <span className="text-base font-black text-slate-900">{totalGeral} h</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Efetivo</span>
                <span className="text-base font-black text-slate-900">{activeWorkersCount} col.</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Obras</span>
                <span className="text-base font-black text-slate-900">{activeObrasCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-mono text-slate-700 truncate">{fileName}</span>
            </div>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Link para o Drive se já tiver feito upload */}
          {driveUploadResult?.webViewLink && (
            <a
              href={driveUploadResult.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs font-semibold text-amber-900 hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-600" />
                <span>PDF guardado no Drive! Abrir na pasta</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            </a>
          )}

          {/* Opções de Ação */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
              Escolha como deseja exportar
            </span>

            {/* 1. Guardar no Google Drive */}
            <button
              type="button"
              onClick={handleExportToGoogleDrive}
              disabled={isExportingDrive}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-slate-50 transition-all text-left group shadow-xs cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Guardar na Pasta do Google Drive
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Cria e guarda na pasta "Folhas de Ponto - Metaloespo"
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 shrink-0">
                {isExportingDrive ? 'A enviar...' : 'Guardar'}
              </span>
            </button>

            {/* 2. Enviar por WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-slate-50 transition-all text-left group shadow-xs cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enviar por WhatsApp</h4>
                  <p className="text-[11px] text-slate-500">
                    Partilha o PDF ou resumo formatado com os encarregados
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">Enviar</span>
            </button>

            {/* 3. Enviar por Email */}
            <button
              type="button"
              onClick={handleShareEmail}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all text-left group shadow-xs cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enviar por Email</h4>
                  <p className="text-[11px] text-slate-500">
                    Abre cliente de correio com o relatório detalhado
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 shrink-0">Email</span>
            </button>

            {/* 4. Descarregar PDF / Imprimir */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-slate-50 transition-all text-left group shadow-xs cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Descarregar PDF / Imprimir</h4>
                  <p className="text-[11px] text-slate-500">
                    Guarda o documento A4 pronto para consulta ou impressão
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 shrink-0">Descarregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
