import React, { useState } from 'react';
import { Colaborador } from '../types';
import { UserCheck, Lock, Shield, KeyRound, AlertCircle, X, ChevronRight, Sparkles } from 'lucide-react';

interface CollaboratorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  onSelectWorker: (worker: Colaborador) => void;
  onSwitchToAdmin: () => void;
  currentWorkerId: string | null;
}

export const CollaboratorLoginModal: React.FC<CollaboratorLoginModalProps> = ({
  isOpen,
  onClose,
  colaboradores,
  onSelectWorker,
  onSwitchToAdmin,
  currentWorkerId,
}) => {
  const [selectedWorker, setSelectedWorker] = useState<Colaborador | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleChooseWorker = (worker: Colaborador) => {
    setSelectedWorker(worker);
    setPinInput('');
    setErrorMsg('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    if (pinInput.trim() === selectedWorker.pin.trim()) {
      onSelectWorker(selectedWorker);
      setSelectedWorker(null);
      setPinInput('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('PIN incorreto. Verifique o seu código de 4 dígitos ou solicite ao encarregado.');
      setPinInput('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg('');
      if (next.length === 4 && selectedWorker) {
        if (next === selectedWorker.pin) {
          setTimeout(() => {
            onSelectWorker(selectedWorker);
            setSelectedWorker(null);
            setPinInput('');
            onClose();
          }, 150);
        } else {
          setTimeout(() => {
            setErrorMsg('PIN incorreto. Tente novamente.');
            setPinInput('');
          }, 150);
        }
      }
    }
  };

  const handleKeypadDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Acesso do Colaborador</h3>
              <p className="text-xs text-slate-300">Registo exclusivo de horas diárias</p>
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
        <div className="p-5 overflow-y-auto flex-1">
          {!selectedWorker ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Selecione o seu nome na lista e insira o seu <strong>PIN pessoal</strong> para aceder diretamente à sua folha de horas no telemóvel.
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Escolha o seu perfil ({colaboradores.filter((c) => c.ativo).length} ativos)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {colaboradores
                    .filter((c) => c.ativo)
                    .map((col) => {
                      const isCurrent = currentWorkerId === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleChooseWorker(col)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20'
                              : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                              style={{ backgroundColor: col.cor }}
                            >
                              {col.nome.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 text-sm">
                                  {col.nome}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 line-clamp-1">
                                {col.funcao}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <KeyRound className="w-4 h-4 text-slate-300" />
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Botão para mudar para Modo Admin */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToAdmin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Entrar como Encarregado / Administrador (PIN Mestre)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Worker Header Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                  style={{ backgroundColor: selectedWorker.cor }}
                >
                  {selectedWorker.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-base leading-tight truncate">
                    {selectedWorker.nome}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{selectedWorker.funcao}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorker(null);
                    setPinInput('');
                    setErrorMsg('');
                  }}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 underline"
                >
                  Trocar
                </button>
              </div>

              {/* PIN Display */}
              <div className="text-center space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Insira o seu PIN de 4 dígitos
                </label>
                <div className="flex justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const hasVal = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-mono text-xl transition-all ${
                          hasVal
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-inner'
                            : 'border-slate-200 bg-white text-transparent'
                        }`}
                      >
                        {hasVal ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  Código de acesso exclusivo deste colaborador
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Teclado Numérico tátil para telemóvel */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-100 active:text-amber-900 text-slate-800 font-bold text-lg font-mono flex items-center justify-center transition-colors shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    // preenchimento rápido de teste com o pin do worker
                    setPinInput(selectedWorker.pin);
                    setTimeout(() => {
                      onSelectWorker(selectedWorker);
                      setSelectedWorker(null);
                      setPinInput('');
                      onClose();
                    }, 100);
                  }}
                  className="h-12 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center transition-colors"
                  title="Ajuda / Preencher PIN do Colaborador"
                >
                  PIN: {selectedWorker.pin}
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-100 active:text-amber-900 text-slate-800 font-bold text-lg font-mono flex items-center justify-center transition-colors shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadDelete}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-semibold text-xs flex items-center justify-center transition-colors shadow-sm"
                >
                  Apagar
                </button>
              </div>

              {/* Botão de Cancelar */}
              <button
                type="button"
                onClick={() => {
                  setSelectedWorker(null);
                  setPinInput('');
                  setErrorMsg('');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
              >
                ← Voltar à lista de colaboradores
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
