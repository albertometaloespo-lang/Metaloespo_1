import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Building2,
  Lock,
} from 'lucide-react';
import { Colaborador, Obra, RegistoHoras, UserRole } from '../types';
import { HoursStatusBadge } from './HoursStatusBadge';

interface AllocationDraft {
  id?: string;
  obraId: string;
  horasNormais: number;
  horasExtra: number;
  descricao: string;
}

interface WorkerLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: Colaborador;
  date: string;
  obras: Obra[];
  initialRegistos: RegistoHoras[];
  isLocked?: boolean;
  userRole?: UserRole;
  onSave: (updatedAllocations: AllocationDraft[]) => void;
}

export const WorkerLogModal: React.FC<WorkerLogModalProps> = ({
  isOpen,
  onClose,
  colaborador,
  date,
  obras,
  initialRegistos,
  isLocked = false,
  userRole = 'colaborador',
  onSave,
}) => {
  // Apenas obras em curso para registo de horas (obras fechadas ou pausadas não aparecem)
  const activeObras = obras.filter((o) => o.estado === 'em_curso');

  // Inicializar o estado com os registos existentes para este colaborador neste dia
  const [allocations, setAllocations] = useState<AllocationDraft[]>(() => {
    if (initialRegistos.length > 0) {
      return initialRegistos.map((r) => ({
        id: r.id,
        obraId: r.obraId,
        horasNormais: r.horasNormais,
        horasExtra: r.horasExtra,
        descricao: r.descricao || '',
      }));
    }
    // Se não tiver nenhum e não estiver bloqueado, inicializa com a primeira obra em curso
    if (!isLocked) {
      const defaultObra = activeObras[0] || obras[0];
      return [
        {
          obraId: defaultObra?.id || '',
          horasNormais: 8.0,
          horasExtra: 0,
          descricao: '',
        },
      ];
    }
    return [];
  });

  if (!isOpen) return null;

  const isReadOnly = isLocked && userRole !== 'administrador';

  const totalNormais = allocations.reduce((acc, curr) => acc + (Number(curr.horasNormais) || 0), 0);
  const totalExtra = allocations.reduce((acc, curr) => acc + (Number(curr.horasExtra) || 0), 0);
  const totalDia = Number((totalNormais + totalExtra).toFixed(2));

  const handleAddObra = () => {
    if (isReadOnly) return;
    const usedObras = new Set(allocations.map((a) => a.obraId));
    const nextObra = activeObras.find((o) => !usedObras.has(o.id)) || activeObras[0] || obras[0];

    setAllocations((prev) => [
      ...prev,
      {
        obraId: nextObra ? nextObra.id : '',
        horasNormais: 4.0,
        horasExtra: 0,
        descricao: '',
      },
    ]);
  };

  const handleRemoveAllocation = (index: number) => {
    if (isReadOnly) return;
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = <K extends keyof AllocationDraft>(
    index: number,
    field: K,
    val: AllocationDraft[K]
  ) => {
    if (isReadOnly) return;
    setAllocations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const stepHours = (index: number, field: 'horasNormais' | 'horasExtra', delta: number) => {
    if (isReadOnly) return;
    const current = allocations[index][field] || 0;
    const newVal = Math.max(0, Math.min(24, Math.round((current + delta) * 2) / 2));
    handleUpdate(index, field, newVal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSave(allocations.filter((a) => a.obraId));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
              style={{ backgroundColor: colaborador.cor }}
            >
              {colaborador.nome
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {colaborador.nome}
                </h2>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                    <Lock className="w-3 h-3 text-amber-400" /> Bloqueado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{colaborador.funcao}</span>
                <span>·</span>
                <span className="font-medium text-slate-700">{date}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner se o dia estiver bloqueado */}
        {isReadOnly && (
          <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center gap-2.5 text-xs">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Atenção:</strong> Os registos deste dia foram validados e bloqueados pelo
              Administrador. Não é possível alterar as horas.
            </span>
          </div>
        )}

        {/* Modal Body: Allocations Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Obras Trabalhadas Neste Dia ({allocations.length})</span>
            </div>
            {!isReadOnly && (
              <span className="text-[11px] text-slate-500">
                Pode adicionar várias obras para o mesmo colaborador
              </span>
            )}
          </div>

          {allocations.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-500 mb-3">Nenhuma obra registada neste dia.</p>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddObra}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Obra
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {allocations.map((alloc, idx) => {
                const selectedObra = obras.find((o) => o.id === alloc.obraId);

                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 relative shadow-2xs space-y-3"
                  >
                    {/* Top Row: Obra selection and Remove button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Obra #{idx + 1}
                        </label>
                        <div className="relative">
                          <select
                            value={alloc.obraId}
                            disabled={isReadOnly}
                            onChange={(e) => handleUpdate(idx, 'obraId', e.target.value)}
                            required
                            className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden min-h-[42px] disabled:bg-slate-100 disabled:text-slate-700"
                          >
                            <option value="" disabled>
                              Selecione a obra...
                            </option>
                            {activeObras.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.codigo} - {o.nome} ({o.cliente})
                              </option>
                            ))}
                            {/* Caso histórico: obra já associada anteriormente que esteja fechada/pausada */}
                            {alloc.obraId && !activeObras.some((o) => o.id === alloc.obraId) && (
                              (() => {
                                const pastObra = obras.find((o) => o.id === alloc.obraId);
                                return pastObra ? (
                                  <option key={pastObra.id} value={pastObra.id} disabled>
                                    {pastObra.codigo} - {pastObra.nome} ({pastObra.cliente}) [Fechada/Pausada]
                                  </option>
                                ) : null;
                              })()
                            )}
                          </select>
                        </div>
                      </div>

                      {!isReadOnly && allocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(idx)}
                          title="Remover esta obra"
                          className="mt-5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {selectedObra && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200/60">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">
                          {selectedObra.cliente} · {selectedObra.localizacao}
                        </span>
                      </div>
                    )}

                    {/* Hours Stepper controls */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Horas Normais */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Horas Normais
                        </label>
                        <div className="flex items-center justify-between gap-1">
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => stepHours(idx, 'horasNormais', -0.5)}
                              className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                            >
                              -
                            </button>
                          )}
                          <div className="flex-1 text-center">
                            <span className="text-base font-bold text-slate-900 tabular-nums">
                              {alloc.horasNormais}
                            </span>
                            <span className="text-xs text-slate-500 ml-0.5">h</span>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => stepHours(idx, 'horasNormais', 0.5)}
                              className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                            >
                              +
                            </button>
                          )}
                        </div>
                        {/* Quick hour presets */}
                        {!isReadOnly && (
                          <div className="flex items-center justify-between gap-1 mt-2">
                            {[2, 4, 8].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => handleUpdate(idx, 'horasNormais', h)}
                                className={`flex-1 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  alloc.horasNormais === h
                                    ? 'bg-slate-900 text-white font-semibold'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {h}h
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Horas Extra */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1.5">
                          Horas Extra
                        </label>
                        <div className="flex items-center justify-between gap-1">
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => stepHours(idx, 'horasExtra', -0.5)}
                              className="w-8 h-8 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-base flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                            >
                              -
                            </button>
                          )}
                          <div className="flex-1 text-center">
                            <span className="text-base font-bold text-amber-900 tabular-nums">
                              {alloc.horasExtra}
                            </span>
                            <span className="text-xs text-amber-600 ml-0.5">h</span>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => stepHours(idx, 'horasExtra', 0.5)}
                              className="w-8 h-8 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-base flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                            >
                              +
                            </button>
                          )}
                        </div>
                        {/* Extra presets */}
                        {!isReadOnly && (
                          <div className="flex items-center justify-between gap-1 mt-2">
                            {[0, 1, 2].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => handleUpdate(idx, 'horasExtra', h)}
                                className={`flex-1 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  alloc.horasExtra === h
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-amber-50/50 text-amber-800 hover:bg-amber-100'
                                }`}
                              >
                                {h}h
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descrição / Tarefa da obra */}
                    <div>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Tarefa realizada (ex: Soldadura, Montagem vigas...)"
                        value={alloc.descricao}
                        onChange={(e) => handleUpdate(idx, 'descricao', e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão Adicionar Mais Uma Obra */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddObra}
              className="w-full py-2.5 px-3 border border-dashed border-amber-400 bg-amber-50/40 hover:bg-amber-50 text-amber-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              + Adicionar Outra Obra para este Colaborador
            </button>
          )}

          {/* Sumário do Dia */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-300 font-medium">Total de Horas no Dia</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span>{totalNormais}h normais</span>
                  {totalExtra > 0 && (
                    <>
                      <span>+</span>
                      <span className="text-amber-300 font-semibold">{totalExtra}h extra</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 tabular-nums">{totalDia}</span>
              <span className="text-xs text-slate-300 ml-1">horas</span>
            </div>
          </div>

          {/* AVISO MANDATÓRIO DE CONTROLO DE 8 HORAS EM TEMPO REAL */}
          <div className="pt-1">
            <HoursStatusBadge totalHours={totalDia} baseHours={8} isLocked={isLocked} compact={false} />
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors min-h-[48px]"
            >
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="flex-2 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-transform min-h-[48px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Guardar Horas ({allocations.length} obra{allocations.length !== 1 ? 's' : ''})
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
