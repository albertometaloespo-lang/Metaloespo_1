import React, { useState } from 'react';
import {
  Users,
  Building2,
  Clock,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Trash2,
  FileText,
} from 'lucide-react';
import { Colaborador, Obra, RegistoHoras, UserRole, ValidacaoDia } from '../types';
import { HoursStatusBadge } from './HoursStatusBadge';

interface DailyLogViewProps {
  selectedDate: string;
  userRole: UserRole;
  isDayLocked: boolean;
  dayValidation?: ValidacaoDia;
  colaboradores: Colaborador[];
  obras: Obra[];
  registos: RegistoHoras[];
  currentWorker?: Colaborador | null;
  onSwitchAccount?: () => void;
  onOpenWorkerModal: (colaborador: Colaborador) => void;
  onOpenBatchModal: () => void;
  onValidateAndLockDay: () => void;
  onUnlockDay: () => void;
  onPromptAdmin: () => void;
  onExportPdf?: () => void;
  onClearDayRegistos?: () => void;
}

export const DailyLogView: React.FC<DailyLogViewProps> = ({
  selectedDate,
  userRole,
  isDayLocked,
  dayValidation,
  colaboradores,
  obras,
  registos,
  currentWorker,
  onSwitchAccount,
  onOpenWorkerModal,
  onOpenBatchModal,
  onValidateAndLockDay,
  onUnlockDay,
  onPromptAdmin,
  onExportPdf,
  onClearDayRegistos,
}) => {
  const [viewMode, setViewMode] = useState<'colaboradores' | 'obras'>('colaboradores');
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('todos');

  // Filtrar registos do dia selecionado
  const dayRegistos = registos.filter((r) => r.data === selectedDate);

  // Mapa rápido de obras
  const obrasMap = new Map(obras.map((o) => [o.id, o]));

  // VISTA DEDICADA DO COLABORADOR: Quando um colaborador individual está autenticado
  if (userRole === 'colaborador' && currentWorker) {
    const workerRegistos = dayRegistos.filter((r) => r.colaboradorId === currentWorker.id);
    const myNormais = workerRegistos.reduce((acc, r) => acc + (r.horasNormais || 0), 0);
    const myExtra = workerRegistos.reduce((acc, r) => acc + (r.horasExtra || 0), 0);
    const myTotal = Number((myNormais + myExtra).toFixed(1));
    const diff = Number((myTotal - currentWorker.horasBaseDia).toFixed(1));

    return (
      <div className="space-y-4 pb-24">
        {/* 1. Header do Colaborador com avatar e botão de trocar conta */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 border-2 border-white/20"
              style={{ backgroundColor: currentWorker.cor }}
            >
              {currentWorker.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white leading-tight">
                  {currentWorker.nome}
                </h2>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  PIN: {currentWorker.pin}
                </span>
              </div>
              <p className="text-xs text-slate-300">{currentWorker.funcao}</p>
            </div>
          </div>

          {onSwitchAccount && (
            <button
              type="button"
              onClick={onSwitchAccount}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Trocar</span>
            </button>
          )}
        </div>

        {/* 2. Aviso de Bloqueio se o dia estiver validado */}
        {isDayLocked && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong className="block font-bold">Dia validado e bloqueado</strong>
              As horas deste dia foram conferidas pelo encarregado e já não podem ser alteradas.
            </div>
          </div>
        )}

        {/* 3. Card de Resumo de Horas do Dia */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Minhas Horas Hoje
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{myTotal}</span>
                <span className="text-sm font-semibold text-slate-400">/ {currentWorker.horasBaseDia}h</span>
              </div>
            </div>
            <HoursStatusBadge
              totalHours={myTotal}
              baseHours={currentWorker.horasBaseDia}
              compact={true}
            />
          </div>

          {/* Barra de Progresso visual das 8h */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (myNormais / currentWorker.horasBaseDia) * 100)}%` }}
              />
              {myExtra > 0 && (
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (myExtra / currentWorker.horasBaseDia) * 100)}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{myNormais}h normais</span>
              {myExtra > 0 ? (
                <span className="text-amber-600 font-bold">+{myExtra}h suplementares</span>
              ) : diff < 0 ? (
                <span className="text-slate-400">Faltam {Math.abs(diff)}h para 8h</span>
              ) : (
                <span className="text-emerald-600 font-bold">8h completas</span>
              )}
            </div>
          </div>

          {/* Botão de Ação: Registar Minhas Horas */}
          {!isDayLocked ? (
            <button
              type="button"
              onClick={() => onOpenWorkerModal(currentWorker)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 text-slate-950" />
              <span>{workerRegistos.length > 0 ? 'Editar / Adicionar Horas a Outra Obra' : '+ Registar as Minhas Horas de Hoje'}</span>
            </button>
          ) : (
            <div className="text-center py-2 text-xs text-slate-400 font-medium">
              Registos encerrados para esta data
            </div>
          )}

          {/* Botão Partilhar / Exportar Ponto Diário em PDF */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Exportar Folha de Ponto (PDF, Drive, WhatsApp)</span>
            </button>
          )}
        </div>

        {/* 4. Lista das obras trabalhadas neste dia */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Minhas Obras Registadas Nesta Data ({workerRegistos.length})
          </h3>

          {workerRegistos.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Sem registos nesta data</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toque no botão acima para indicar a obra e as horas trabalhadas.
                </p>
              </div>
            </div>
          ) : (
            workerRegistos.map((reg) => {
              const obra = obrasMap.get(reg.obraId);
              return (
                <div
                  key={reg.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {obra?.codigo || 'OBRA'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {obra?.nome || 'Obra'}
                        </h4>
                      </div>
                      {obra?.cliente && (
                        <p className="text-xs text-slate-500">Cliente: {obra.cliente}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        {(reg.horasNormais || 0) + (reg.horasExtra || 0)}h
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {reg.horasNormais || 0}h N {reg.horasExtra ? `+ ${reg.horasExtra}h Ex` : ''}
                      </div>
                    </div>
                  </div>

                  {reg.descricao && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                      "{reg.descricao}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé: Alternar para Administrador */}
        <div className="pt-3 text-center">
          <button
            type="button"
            onClick={onPromptAdmin}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso Encarregado / Administrador</span>
          </button>
        </div>
      </div>
    );
  }

  // Totais do dia (Modo Geral / Administrador)
  const totalHorasNormais = dayRegistos.reduce((acc, r) => acc + (r.horasNormais || 0), 0);
  const totalHorasExtra = dayRegistos.reduce((acc, r) => acc + (r.horasExtra || 0), 0);
  const totalGeralDia = Number((totalHorasNormais + totalHorasExtra).toFixed(1));

  // Obras trabalhadas no dia
  const uniqueObrasToday = new Set(dayRegistos.map((r) => r.obraId));
  // Colaboradores com registo no dia
  const uniqueColsToday = new Set(dayRegistos.map((r) => r.colaboradorId));

  // Contadores para alertas de 8h
  let countExcedeu8h = 0;
  let countExatamente8h = 0;
  let countIncompletos = 0;

  colaboradores
    .filter((c) => c.ativo)
    .forEach((col) => {
      const colRegs = dayRegistos.filter((r) => r.colaboradorId === col.id);
      const total = colRegs.reduce(
        (acc, curr) => acc + (curr.horasNormais || 0) + (curr.horasExtra || 0),
        0
      );
      if (total > 8) countExcedeu8h++;
      else if (total === 8) countExatamente8h++;
      else countIncompletos++;
    });

  const activeColaboradores = colaboradores.filter((c) => c.ativo);
  const displayedColaboradores =
    selectedCollaboratorId === 'todos'
      ? activeColaboradores
      : activeColaboradores.filter((c) => c.id === selectedCollaboratorId);

  // As obras fechadas ou em pausa não deverão aparecer na listagem de registos de horas
  const activeObras = obras.filter((o) => o.estado === 'em_curso');

  return (
    <div className="space-y-4 pb-24">
      {/* 1. BARRA DE COMANDO DO ADMINISTRADOR: VALIDAÇÃO E BLOQUEIO */}
      {userRole === 'administrador' ? (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDayLocked
              ? 'bg-slate-900 border-slate-800 text-white shadow-md'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDayLocked ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-500 text-slate-950'
                }`}
              >
                {isDayLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm font-bold leading-tight ${
                      isDayLocked ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {isDayLocked
                      ? 'Registos Validados e Bloqueados'
                      : 'Validação e Bloqueio de Registos'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isDayLocked
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {isDayLocked ? 'Bloqueado' : 'Em Aberto'}
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    isDayLocked ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {isDayLocked
                    ? `Validado por ${dayValidation?.validadoPor || 'Administrador'} em ${
                        dayValidation?.validadoEm || selectedDate
                      }. Os colaboradores não podem alterar estas horas.`
                    : 'Como Administrador, pode validar e bloquear as horas deste dia para congelar alterações.'}
                </p>
              </div>
            </div>

            {/* Comando do Administrador */}
            <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2">
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-transform active:scale-98 min-h-[42px] cursor-pointer"
                  title="Exportar folha de ponto em PDF para o Google Drive, WhatsApp ou Email"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>Exportar Ponto (PDF)</span>
                </button>
              )}
              {dayRegistos.length > 0 && onClearDayRegistos && !isDayLocked && (
                <button
                  onClick={onClearDayRegistos}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors min-h-[42px] cursor-pointer"
                  title="Limpar registos deste dia"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Limpar Dia ({dayRegistos.length})</span>
                </button>
              )}
              {isDayLocked ? (
                <button
                  onClick={onUnlockDay}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors min-h-[42px] cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Desbloquear Dia para Edição</span>
                </button>
              ) : (
                <button
                  onClick={onValidateAndLockDay}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-transform active:scale-98 min-h-[42px] cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Validar e Bloquear Registos</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : isDayLocked ? (
        /* Aviso para o Colaborador quando o dia estiver bloqueado */
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Registos deste dia validados e bloqueados</p>
              <p className="text-[11px] text-slate-300">
                Aprovados pelo Administrador. As horas encontram-se em modo de consulta.
              </p>
            </div>
          </div>
          <button
            onClick={onPromptAdmin}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap"
          >
            Acesso Admin
          </button>
        </div>
      ) : null}

      {/* 2. CARDS DE RESUMO RÁPIDO DO DIA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total de Horas</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{totalGeralDia}</span>
            <span className="text-xs text-slate-400 font-medium">horas</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {totalHorasNormais}h normais + {totalHorasExtra}h extra
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Colaboradores</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {uniqueColsToday.size}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {colaboradores.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">com registo hoje</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Obras Ativas</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {uniqueObrasToday.size}
            </span>
            <span className="text-xs text-slate-400 font-medium">em curso</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">com trabalho hoje</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Horas Extra</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 tabular-nums">{totalHorasExtra}</span>
            <span className="text-xs text-slate-400 font-medium">horas</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">trabalho suplementar</div>
        </div>
      </div>

      {/* 3. AVISOS GERAIS DE CONTROLO DE 8 HORAS */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Excederam 8h</span>
          </div>
          <p className="text-lg font-black text-amber-900 tabular-nums mt-0.5">{countExcedeu8h}</p>
          <span className="text-[10px] text-amber-700 font-medium">com horas extras</span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exatamente 8h</span>
          </div>
          <p className="text-lg font-black text-emerald-900 tabular-nums mt-0.5">{countExatamente8h}</p>
          <span className="text-[10px] text-emerald-700 font-medium">dia completo</span>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-800 font-bold text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Incompletos</span>
          </div>
          <p className="text-lg font-black text-blue-900 tabular-nums mt-0.5">{countIncompletos}</p>
          <span className="text-[10px] text-blue-700 font-medium">&lt; 8h registadas</span>
        </div>
      </div>

      {/* 4. BARRA DE AÇÕES: Vistas e Registo por Obra */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setViewMode('colaboradores')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'colaboradores'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Colaborador</span>
          </button>
          <button
            onClick={() => setViewMode('obras')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'obras'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Por Obra</span>
          </button>
        </div>

        {/* Botão de Registo em Lote por Equipa (Apenas disponível se não estiver bloqueado ou se for admin) */}
        {!isDayLocked && (
          <button
            onClick={onOpenBatchModal}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-[0.98] shadow-2xs min-h-[42px] cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Registar Equipa por Obra</span>
          </button>
        )}
      </div>

      {/* Seletor rápido de colaborador para mobile */}
      {viewMode === 'colaboradores' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Filtrar:
          </span>
          <button
            onClick={() => setSelectedCollaboratorId('todos')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedCollaboratorId === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todos ({activeColaboradores.length})
          </button>
          {activeColaboradores.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCollaboratorId(c.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCollaboratorId === c.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.nome.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* VISÃO 1: POR COLABORADOR */}
      {viewMode === 'colaboradores' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Colaboradores ({displayedColaboradores.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              {isDayLocked ? 'Bloqueado para alterações' : 'Toque para gerir/adicionar obras'}
            </span>
          </div>

          <div className="space-y-3">
            {displayedColaboradores.map((colaborador) => {
              const colRegistos = dayRegistos.filter((r) => r.colaboradorId === colaborador.id);
              const colNormais = colRegistos.reduce((a, b) => a + (b.horasNormais || 0), 0);
              const colExtra = colRegistos.reduce((a, b) => a + (b.horasExtra || 0), 0);
              const colTotal = Number((colNormais + colExtra).toFixed(1));
              const temMultiplasObras = colRegistos.length > 1;

              return (
                <div
                  key={colaborador.id}
                  onClick={() => onOpenWorkerModal(colaborador)}
                  className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer active:scale-[0.99] ${
                    isDayLocked
                      ? 'border-slate-200 hover:border-slate-300'
                      : colTotal > 8
                      ? 'border-amber-300 hover:border-amber-500 shadow-2xs'
                      : colTotal === 8
                      ? 'border-emerald-200 hover:border-emerald-400'
                      : 'border-slate-200/90 hover:border-amber-400'
                  }`}
                >
                  {/* Cabeçalho do Colaborador com Avatar e Totais */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0"
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
                          <h4 className="text-base font-bold text-slate-900 leading-tight">
                            {colaborador.nome}
                          </h4>
                          {temMultiplasObras && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold text-[10px]">
                              {colRegistos.length} obras hoje
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{colaborador.funcao}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span
                          className={`text-2xl font-black tabular-nums ${
                            colTotal > 8
                              ? 'text-amber-600'
                              : colTotal === 8
                              ? 'text-emerald-600'
                              : colTotal > 0
                              ? 'text-blue-600'
                              : 'text-slate-300'
                          }`}
                        >
                          {colTotal > 0 ? colTotal : '0'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">h</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {colNormais}h normais {colExtra > 0 && `+ ${colExtra}h ex`}
                      </div>
                    </div>
                  </div>

                  {/* AVISO DE CONTROLO DE 8 HORAS DIÁRIAS (Mandatory Requirement) */}
                  <div className="mt-3">
                    <HoursStatusBadge
                      totalHours={colTotal}
                      baseHours={8}
                      isLocked={isDayLocked}
                      compact={false}
                    />
                  </div>

                  {/* Lista de Obras trabalhadas por este colaborador */}
                  {colRegistos.length > 0 ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                        <span>Obras atribuídas ({colRegistos.length}):</span>
                        {!isDayLocked && (
                          <span className="text-amber-700 font-medium">+ Editar / Adicionar</span>
                        )}
                      </div>
                      {colRegistos.map((reg) => {
                        const obr = obrasMap.get(reg.obraId);
                        const totalReg = Number((reg.horasNormais + reg.horasExtra).toFixed(1));

                        return (
                          <div
                            key={reg.id}
                            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="font-bold text-slate-700 font-mono text-[11px] shrink-0">
                                {obr?.codigo || 'OBRA'}
                              </span>
                              <span className="text-slate-800 font-semibold truncate">
                                {obr?.nome || 'Obra Removida'}
                              </span>
                              {reg.descricao && (
                                <span className="text-slate-400 text-[11px] hidden sm:inline truncate">
                                  · {reg.descricao}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                              <span className="font-bold text-slate-900">{totalReg}h</span>
                              {reg.horasExtra > 0 && (
                                <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">
                                  +{reg.horasExtra}h extra
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Nenhuma hora registada para este colaborador</span>
                      {!isDayLocked && (
                        <span className="text-amber-600 font-bold text-xs flex items-center gap-0.5">
                          <Plus className="w-3.5 h-3.5" /> Registar Horas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO 2: POR OBRA */}
      {viewMode === 'obras' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Obras em Curso ({activeObras.length})
            </h3>
            <span className="text-[11px] text-slate-500">Horas acumuladas hoje</span>
          </div>

          <div className="space-y-3">
            {activeObras.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-sm font-bold text-slate-700">Nenhuma obra em curso ativa</p>
                <p className="text-xs text-slate-400">As obras concluídas ou pausadas estão ocultas dos registos de horas.</p>
              </div>
            ) : activeObras.map((obra) => {
                const obrRegistos = dayRegistos.filter((r) => r.obraId === obra.id);
              const obrTotalHoras = obrRegistos.reduce(
                (a, b) => a + (b.horasNormais || 0) + (b.horasExtra || 0),
                0
              );

              return (
                <div
                  key={obra.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {obra.codigo}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{obra.nome}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{obra.cliente}</span>
                        <span>·</span>
                        <span>{obra.localizacao}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-slate-900 tabular-nums">
                        {obrTotalHoras.toFixed(1)}
                        <span className="text-xs font-medium text-slate-400 ml-0.5">h</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {obrRegistos.length} colaborador{obrRegistos.length !== 1 ? 'es' : ''}
                      </div>
                    </div>
                  </div>

                  {obrRegistos.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {obrRegistos.map((reg) => {
                        const col = colaboradores.find((c) => c.id === reg.colaboradorId);
                        const total = Number((reg.horasNormais + reg.horasExtra).toFixed(1));

                        return (
                          <div
                            key={reg.id}
                            onClick={() => col && onOpenWorkerModal(col)}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                style={{ backgroundColor: col?.cor || '#64748b' }}
                              >
                                {col?.nome[0] || 'C'}
                              </div>
                              <span className="font-medium text-slate-800 truncate">
                                {col?.nome || 'Colaborador'}
                              </span>
                              {reg.descricao && (
                                <span className="text-slate-400 text-[11px] truncate">
                                  · {reg.descricao}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-bold tabular-nums shrink-0">
                              <span>{total}h</span>
                              {reg.horasExtra > 0 && (
                                <span className="text-[10px] text-amber-700">
                                  (+{reg.horasExtra}h)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                      <span>Sem atividade registada hoje</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
