import React, { useState } from 'react';
import {
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  Clock,
  Sparkles,
  Filter,
  Trash2,
  FileText,
} from 'lucide-react';
import { Colaborador, Obra, RegistoHoras } from '../types';

interface ReportsViewProps {
  colaboradores: Colaborador[];
  obras: Obra[];
  registos: RegistoHoras[];
  onClearAllRegistos?: () => void;
  onOpenExportPdf?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  colaboradores,
  obras,
  registos,
  onClearAllRegistos,
  onOpenExportPdf,
}) => {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('mes');
  const [activeTab, setActiveTab] = useState<'obras' | 'colaboradores' | 'detalhado'>('obras');

  // Mapeamentos
  const colMap = new Map(colaboradores.map((c) => [c.id, c]));
  const obrMap = new Map(obras.map((o) => [o.id, o]));

  // Filtragem por período
  const filteredRegistos = React.useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (periodo === 'hoje') {
      return registos.filter((r) => r.data === todayStr);
    }

    if (periodo === 'semana') {
      // Últimos 7 dias
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const weekStr = weekAgo.toISOString().split('T')[0];
      return registos.filter((r) => r.data >= weekStr && r.data <= todayStr);
    }

    if (periodo === 'mes') {
      const monthPrefix = today.toISOString().slice(0, 7);
      return registos.filter((r) => r.data.startsWith(monthPrefix));
    }

    return registos;
  }, [registos, periodo]);

  // Totais
  const totalNormais = filteredRegistos.reduce((a, b) => a + (b.horasNormais || 0), 0);
  const totalExtra = filteredRegistos.reduce((a, b) => a + (b.horasExtra || 0), 0);
  const totalGeral = Number((totalNormais + totalExtra).toFixed(1));

  // Agrupamento por Obra
  const obrasSummary = React.useMemo(() => {
    const acc: Record<string, { obra: Obra | undefined; normais: number; extra: number; total: number; diasCount: Set<string> }> = {};

    obras.forEach((obr) => {
      acc[obr.id] = { obra: obr, normais: 0, extra: 0, total: 0, diasCount: new Set() };
    });

    filteredRegistos.forEach((r) => {
      if (!acc[r.obraId]) {
        acc[r.obraId] = {
          obra: obrMap.get(r.obraId),
          normais: 0,
          extra: 0,
          total: 0,
          diasCount: new Set(),
        };
      }
      acc[r.obraId].normais += r.horasNormais || 0;
      acc[r.obraId].extra += r.horasExtra || 0;
      acc[r.obraId].total += (r.horasNormais || 0) + (r.horasExtra || 0);
      acc[r.obraId].diasCount.add(r.data);
    });

    return Object.values(acc)
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredRegistos, obras, obrMap]);

  // Agrupamento por Colaborador
  const colSummary = React.useMemo(() => {
    const acc: Record<string, { col: Colaborador | undefined; normais: number; extra: number; total: number; diasCount: Set<string> }> = {};

    colaboradores.forEach((c) => {
      acc[c.id] = { col: c, normais: 0, extra: 0, total: 0, diasCount: new Set() };
    });

    filteredRegistos.forEach((r) => {
      if (!acc[r.colaboradorId]) {
        acc[r.colaboradorId] = {
          col: colMap.get(r.colaboradorId),
          normais: 0,
          extra: 0,
          total: 0,
          diasCount: new Set(),
        };
      }
      acc[r.colaboradorId].normais += r.horasNormais || 0;
      acc[r.colaboradorId].extra += r.horasExtra || 0;
      acc[r.colaboradorId].total += (r.horasNormais || 0) + (r.horasExtra || 0);
      acc[r.colaboradorId].diasCount.add(r.data);
    });

    return Object.values(acc)
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredRegistos, colaboradores, colMap]);

  // Exportar para Excel CSV (formato compatível com Excel em Portugal/Europa)
  const handleExportCSV = () => {
    const BOM = '\uFEFF'; // Força Excel a reconhecer caracteres portugueses UTF-8
    const headers = [
      'Data',
      'Colaborador',
      'Funcao',
      'Codigo Obra',
      'Nome Obra',
      'Cliente',
      'Horas Normais',
      'Horas Extra',
      'Total Horas',
      'Tarefa / Descricao',
      'Validado Admin',
    ];

    const rows = filteredRegistos.map((r) => {
      const col = colMap.get(r.colaboradorId);
      const obr = obrMap.get(r.obraId);
      const total = (r.horasNormais + r.horasExtra).toFixed(1).replace('.', ',');
      const norm = r.horasNormais.toString().replace('.', ',');
      const ext = r.horasExtra.toString().replace('.', ',');
      const valid = r.bloqueado || r.validado ? 'Sim' : 'Nao';

      return [
        `"${r.data}"`,
        `"${col?.nome || 'N/A'}"`,
        `"${col?.funcao || 'N/A'}"`,
        `"${obr?.codigo || 'N/A'}"`,
        `"${obr?.nome || 'N/A'}"`,
        `"${obr?.cliente || 'N/A'}"`,
        `"${norm}"`,
        `"${ext}"`,
        `"${total}"`,
        `"${(r.descricao || '').replace(/"/g, '""')}"`,
        `"${valid}"`,
      ].join(';');
    });

    const csvContent = BOM + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ObraTempo_Relatorio_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header do Relatório */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Relatórios & Análise</h2>
          <p className="text-xs text-slate-500">Resumo de horas trabalhadas por obra e colaborador</p>
        </div>

        {/* Botões de Ação: Exportar, Imprimir e Limpar Registos */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {registos.length > 0 && onClearAllRegistos && (
            <button
              onClick={onClearAllRegistos}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs shadow-2xs transition-colors min-h-[40px] cursor-pointer"
              title="Limpar todos os registos de horas da aplicação"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Limpar Registos ({registos.length})</span>
            </button>
          )}
          {onOpenExportPdf && (
            <button
              onClick={onOpenExportPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition-colors min-h-[40px] cursor-pointer"
              title="Exportar folha de ponto diária em PDF (Drive, WhatsApp ou Email)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>Ponto Diário (PDF)</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={filteredRegistos.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-2xs transition-colors min-h-[40px] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel (.csv)</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredRegistos.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 font-semibold text-xs transition-colors min-h-[40px] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Seletor de Período */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'hoje', label: 'Hoje' },
          { id: 'semana', label: 'Últimos 7 dias' },
          { id: 'mes', label: 'Este Mês' },
          { id: 'todos', label: 'Todo o Histórico' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPeriodo(item.id as any)}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              periodo === item.id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Horas Totais</span>
          <div className="text-xl font-black text-slate-900 tabular-nums mt-0.5">{totalGeral} h</div>
          <span className="text-[10px] text-slate-400">no período</span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Horas Normais</span>
          <div className="text-xl font-black text-blue-600 tabular-nums mt-0.5">
            {totalNormais.toFixed(1)} h
          </div>
          <span className="text-[10px] text-slate-400">trabalho base</span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Horas Extra</span>
          <div className="text-xl font-black text-amber-600 tabular-nums mt-0.5">
            {totalExtra.toFixed(1)} h
          </div>
          <span className="text-[10px] text-amber-700 font-medium">suplementares</span>
        </div>
      </div>

      {/* Sub-Tabs de visualização */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('obras')}
          className={`pb-2.5 transition-colors relative cursor-pointer ${
            activeTab === 'obras' ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-700'
          }`}
        >
          Resumo por Obra ({obrasSummary.length})
        </button>
        <button
          onClick={() => setActiveTab('colaboradores')}
          className={`pb-2.5 transition-colors relative cursor-pointer ${
            activeTab === 'colaboradores'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'hover:text-slate-700'
          }`}
        >
          Resumo por Colaborador ({colSummary.length})
        </button>
        <button
          onClick={() => setActiveTab('detalhado')}
          className={`pb-2.5 transition-colors relative cursor-pointer ${
            activeTab === 'detalhado'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'hover:text-slate-700'
          }`}
        >
          Registos Diários ({filteredRegistos.length})
        </button>
      </div>

      {/* Conteúdo da Tab 1: Resumo por Obra */}
      {activeTab === 'obras' && (
        <div className="space-y-2.5">
          {obrasSummary.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sem registos de obras</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não existem horas registadas por obra para o período selecionado ou os registos foram limpos.
              </p>
            </div>
          ) : (
            obrasSummary.map((item) => {
              const obr = item.obra;
              const percentage = totalGeral > 0 ? ((item.total / totalGeral) * 100).toFixed(1) : 0;

              return (
                <div
                  key={obr?.id || Math.random()}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {obr?.codigo || 'OBRA'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{obr?.nome || 'Obra'}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {obr?.cliente} · {obr?.localizacao}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-slate-900 tabular-nums">
                        {item.total.toFixed(1)} h
                      </span>
                      <p className="text-[11px] text-slate-400">{percentage}% do período</p>
                    </div>
                  </div>

                  {/* Barra de progresso proporcional */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-slate-900 h-full"
                      style={{
                        width: `${totalGeral > 0 ? (item.normais / totalGeral) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width: `${totalGeral > 0 ? (item.extra / totalGeral) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>
                      {item.normais.toFixed(1)}h normais · {item.extra.toFixed(1)}h extra
                    </span>
                    <span>{item.diasCount.size} dias com atividade</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Conteúdo da Tab 2: Resumo por Colaborador */}
      {activeTab === 'colaboradores' && (
        <div className="space-y-2.5">
          {colSummary.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sem registos de colaboradores</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não existem horas registadas por colaboradores para o período selecionado ou os registos foram limpos.
              </p>
            </div>
          ) : (
            colSummary.map((item) => {
              const col = item.col;

              return (
                <div
                  key={col?.id || Math.random()}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0"
                        style={{ backgroundColor: col?.cor || '#64748b' }}
                      >
                        {col?.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('') || 'C'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{col?.nome}</h4>
                        <p className="text-xs text-slate-500">{col?.funcao}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-slate-900 tabular-nums">
                        {item.total.toFixed(1)} h
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {item.normais.toFixed(1)}h normais
                        {item.extra > 0 && (
                          <span className="text-amber-700 font-semibold ml-1">
                            +{item.extra.toFixed(1)}h ex
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Conteúdo da Tab 3: Tabela Detalhada de Registos */}
      {activeTab === 'detalhado' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {filteredRegistos.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sem registos detalhados</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não existem registos individuais de horas no período selecionado ou os registos foram limpos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">Obra</th>
                    <th className="py-2.5 px-3 text-right">Normais</th>
                    <th className="py-2.5 px-3 text-right">Extra</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Validado</th>
                    <th className="py-2.5 px-3">Tarefa / Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistos.map((reg) => {
                    const col = colMap.get(reg.colaboradorId);
                    const obr = obrMap.get(reg.obraId);
                    const total = (reg.horasNormais + reg.horasExtra).toFixed(1);

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                          {reg.data}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {col?.nome || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-700 mr-1.5">
                            {obr?.codigo}
                          </span>
                          <span className="text-slate-800">{obr?.nome}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                          {reg.horasNormais}h
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-amber-700 font-semibold">
                          {reg.horasExtra > 0 ? `+${reg.horasExtra}h` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black tabular-nums text-slate-900">
                          {total}h
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {reg.bloqueado || reg.validado ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                              Aberto
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">
                          {reg.descricao || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
