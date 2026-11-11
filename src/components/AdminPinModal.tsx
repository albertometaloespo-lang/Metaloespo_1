import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storage';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = StorageService.getAdminPin();
    if (pin.trim() === correctPin || pin.trim() === '1234') {
      StorageService.setAdminMode(true);
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Acesso de Administrador
              </h3>
              <p className="text-[11px] text-slate-500">Validação e bloqueio de registos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Introduza o PIN de Administrador para validar, bloquear ou desbloquear os registos diários.
            <span className="block text-[11px] text-slate-400 mt-1">(PIN padrão: 1234)</span>
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PIN de Administrador</label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Introduza o PIN..."
                className="w-full text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-slate-300 px-4 py-2.5 bg-white shadow-2xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PIN incorreto. Tente novamente ou use 1234.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pin}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 min-h-[44px] shadow-sm flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Confirmar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
