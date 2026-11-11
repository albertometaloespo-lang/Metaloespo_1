import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock, Clock } from 'lucide-react';

interface HoursStatusBadgeProps {
  totalHours?: number;
  baseHours?: number; // padrão 8h
  isLocked?: boolean;
  compact?: boolean;
  horasNormais?: number;
  horasExtra?: number;
  horasBase?: number;
}

export const HoursStatusBadge: React.FC<HoursStatusBadgeProps> = ({
  totalHours,
  baseHours,
  isLocked = false,
  compact = false,
  horasNormais,
  horasExtra,
  horasBase,
}) => {
  const calculatedTotal =
    totalHours !== undefined
      ? totalHours
      : (horasNormais ?? 0) + (horasExtra ?? 0);
  const effectiveBase = baseHours ?? horasBase ?? 8;
  const rounded = Number(calculatedTotal.toFixed(1));
  const diff = Number((rounded - effectiveBase).toFixed(1));

  // 1. Caso bloqueado pelo Administrador
  if (isLocked) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white shrink-0">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>Validado & Bloqueado</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xs">
        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1">
          <span className="font-bold text-amber-400">Registo Validado e Bloqueado</span>
          <p className="text-[11px] text-slate-300">
            Aprovado pelo Administrador. Edição bloqueada para este dia.
          </p>
        </div>
      </div>
    );
  }

  // 2. Caso excedeu as horas base (Horas Extras)
  if (rounded > effectiveBase) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Excedeu {effectiveBase}h (+{diff}h extras)</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-900">Atenção: Excedeu as {effectiveBase}h diárias</span>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Total de {rounded}h registadas ({effectiveBase}h normais + {diff}h de trabalho extraordinário).
          </p>
        </div>
      </div>
    );
  }

  // 3. Caso cumpriu exatamente as horas base
  if (rounded === effectiveBase) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Dia completo ({effectiveBase}.0h)</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold text-emerald-800">Dia completo ({effectiveBase} horas cumpridas)</span>
          <p className="text-[11px] text-emerald-700 mt-0.5">Jornada normal de trabalho preenchida.</p>
        </div>
      </div>
    );
  }

  // 4. Caso não tenha horas base (Incompleto ou Sem registo)
  const missing = Number((effectiveBase - rounded).toFixed(1));

  if (rounded === 0) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Sem registo (0h / {effectiveBase}h)</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs">
        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
        <div>
          <span className="font-bold text-slate-800">Sem registo neste dia</span>
          <p className="text-[11px] text-slate-500 mt-0.5">0h de {effectiveBase}h previstas.</p>
        </div>
      </div>
    );
  }

  // rounded > 0 e rounded < effectiveBase
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Incompleto ({rounded}h - faltam {missing}h)</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
      <Info className="w-4 h-4 text-blue-600 shrink-0" />
      <div>
        <span className="font-bold text-blue-800">Aviso: Não atingiu as {effectiveBase}h diárias</span>
        <p className="text-[11px] text-blue-700 mt-0.5">
          Foram registadas {rounded}h. Faltam {missing}h para perfazer a jornada de {effectiveBase}h.
        </p>
      </div>
    </div>
  );
};
