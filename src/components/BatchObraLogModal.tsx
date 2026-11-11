import React, { useState } from 'react';
import { X, Users, Check, Building2, Lock, AlertTriangle } from 'lucide-react';
import { Colaborador, Obra, RegistoHoras } from '../types';

interface BatchObraLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  obras: Obra[];
  colaboradores: Colaborador[];
  existingRegistos: RegistoHoras[];
  isLocked?: boolean;
  onSaveBatch: (
    obraId: string,
    workerLogs: { colaboradorId: string; horasNormais: number; horasExtra: number; descricao: string }[]
  ) => void;
}

export const BatchObraLogModal: React.FC<BatchObraLogModalProps> = ({
  isOpen,
  onClose,
  date,
  obras,
  colaboradores,
  existingRegistos,
  isLocked = false,
  onSaveBatch,
}) => {
  // Apenas obras em curso podem ser selecionadas para registo
  const activeObras = obras.filter((o) => o.estado === 'em_curso');

  const [selectedObraId, setSelectedObraId] = useState<string>(activeObras[0]?.id || obras[0]?.id || '');
  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, {
    selected: boolean;
    horasNormais: number;
    horasExtra: number;
    descricao: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    const defaultObraId = activeObras[0]?.id || obras[0]?.id || '';
    colaboradores.forEach((col) => {
      const existing = existingRegistos.find(
        (r) => r.data === date && r.colaboradorId === col.id && r.obraId === defaultObraId
      );
      initial[col.id] = {
        selected: !!existing,
        horasNormais: existing ? existing.horasNormais : 8,
        horasExtra: existing ? existing.horasExtra : 0,
        descricao: existing ? existing.descricao || '' : '',
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleObraChange = (obraId: string) => {
    setSelectedObraId(obraId);
    const updated: Record<string, any> = {};
    colaboradores.forEach((col) => {
      const existing = existingRegistos.find(
        (r) => r.data === date && r.colaboradorId === col.id && r.obraId === obraId
      );
      updated[col.id] = {
        selected: !!existing,
        horasNormais: existing ? existing.horasNormais : 8,
        horasExtra: existing ? existing.horasExtra : 0,
        descricao: existing ? existing.descricao || '' : '',
      };
    });
    setSelectedWorkers(updated);
  };

  const toggleWorker = (colId: string) => {
    if (isLocked) return;
    setSelectedWorkers((prev) => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        selected: !prev[colId]?.selected,
      },
    }));
  };

  const updateWorkerHours = (colId: string, field: 'horasNormais' | 'horasExtra', val: number) => {
    if (isLocked) return;
    setSelectedWorkers((prev) => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        [field]: Math.max(0, val),
      },
    }));
  };

  const selectAll = (select: boolean) => {
    if (isLocked) return;
    setSelectedWorkers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], selected: select };
      });
      return next;
    });
  };

  const setBulkHours = (hours: number) => {
    if (isLocked) return;
    setSelectedWorkers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id]?.selected) {
          next[id] = { ...next[id], horasNormais: hours };
        }
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const batch = Object.entries(selectedWorkers)
      .filter(([_, data]) => data.selected)
      .map(([colId, data]) => ({
        colaboradorId: colId,
        horasNormais: data.horasNormais,
        horasExtra: data.horasExtra,
        descricao: data.descricao,
      }));

    onSaveBatch(selectedObraId, batch);
    onClose();
  };

  const selectedCount = Object.values(selectedWorkers).filter((w) => w.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Registo de Equipa por Obra
                </h2>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                    <Lock className="w-3 h-3 text-amber-400" /> Bloqueado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Atribui horas a vários colaboradores nesta obra em {date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLocked && (
          <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Dia validado e bloqueado pelo Administrador. Edição desativada.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Obra selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Obra Selecionada
            </label>
            <div className="relative">
              <select
                value={selectedObraId}
                disabled={isLocked}
                onChange={(e) => handleObraChange(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden min-h-[44px] disabled:bg-slate-100"
              >
                {activeObras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.codigo} - {o.nome} ({o.cliente})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick crew controls */}
          {!isLocked && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100/70 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="px-2.5 py-1 font-medium bg-white rounded-lg shadow-2xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Selecionar Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="px-2.5 py-1 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Desmarcar
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 hidden sm:inline">Definir horas:</span>
                <button
                  type="button"
                  onClick={() => setBulkHours(4)}
                  className="px-2 py-1 font-bold bg-white text-slate-800 rounded shadow-2xs text-[11px] hover:bg-slate-50 cursor-pointer"
                >
                  4h
                </button>
                <button
                  type="button"
                  onClick={() => setBulkHours(8)}
                  className="px-2 py-1 font-bold bg-amber-500 text-slate-950 rounded shadow-2xs text-[11px] hover:bg-amber-400 cursor-pointer"
                >
                  8h
                </button>
              </div>
            </div>
          )}

          {/* Workers checklist */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">
              Colaboradores Presentes ({selectedCount}/{colaboradores.length}):
            </p>
            {colaboradores.map((col) => {
              const state = selectedWorkers[col.id] || {
                selected: false,
                horasNormais: 8,
                horasExtra: 0,
                descricao: '',
              };

              const totalWorkerHours = state.horasNormais + state.horasExtra;

              return (
                <div
                  key={col.id}
                  className={`p-3 rounded-xl border transition-all ${
                    state.selected
                      ? 'border-amber-400 bg-amber-50/20 shadow-2xs'
                      : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      onClick={() => toggleWorker(col.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer select-none min-h-[44px]"
                    >
                      {!isLocked && (
                        <button
                          type="button"
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            state.selected
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'border border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </button>
                      )}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: col.cor }}
                      >
                        {col.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                          {col.nome}
                        </p>
                        <p className="text-[11px] text-slate-500">{col.funcao}</p>
                      </div>
                    </div>

                    {state.selected && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <label className="text-[10px] text-slate-500">Normais:</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            min="0"
                            max="24"
                            step="0.5"
                            value={state.horasNormais}
                            onChange={(e) =>
                              updateWorkerHours(col.id, 'horasNormais', parseFloat(e.target.value) || 0)
                            }
                            className="w-11 text-center font-bold text-xs bg-transparent outline-hidden"
                          />
                          <span className="text-[10px] text-slate-400">h</span>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50/60 px-2 py-1 rounded-lg border border-amber-200/60">
                          <label className="text-[10px] text-amber-800">Extra:</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            min="0"
                            max="12"
                            step="0.5"
                            value={state.horasExtra}
                            onChange={(e) =>
                              updateWorkerHours(col.id, 'horasExtra', parseFloat(e.target.value) || 0)
                            }
                            className="w-10 text-center font-bold text-xs bg-transparent outline-hidden text-amber-900"
                          />
                          <span className="text-[10px] text-amber-700">h</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alerta de 8 horas */}
                  {state.selected && totalWorkerHours > 8 && (
                    <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Excede 8h diárias (+{(totalWorkerHours - 8).toFixed(1)}h extraordinárias)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[48px]"
            >
              {isLocked ? 'Fechar' : 'Cancelar'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={selectedCount === 0}
                className="flex-2 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 min-h-[48px] shadow-sm cursor-pointer"
              >
                Registar {selectedCount} Colaboradore{selectedCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
