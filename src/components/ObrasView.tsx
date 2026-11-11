import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Obra, RegistoHoras } from '../types';

interface ObrasViewProps {
  obras: Obra[];
  registos: RegistoHoras[];
  onSaveObra: (obra: Obra) => void;
  onDeleteObra: (obraId: string) => void;
}

export const ObrasView: React.FC<ObrasViewProps> = ({
  obras,
  registos,
  onSaveObra,
  onDeleteObra,
}) => {
  const [filter, setFilter] = useState<'todas' | 'em_curso' | 'pausada' | 'concluida'>('todas');
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulário de Obra
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    cliente: '',
    localizacao: '',
    estado: 'em_curso' as Obra['estado'],
  });

  const handleOpenAdd = () => {
    // Gerar próximo código sugerido
    const nextNum = obras.length + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    setFormData({
      codigo: `OBR-${year}-${String(nextNum).padStart(2, '0')}`,
      nome: '',
      cliente: '',
      localizacao: '',
      estado: 'em_curso',
    });
    setEditingObra(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (obr: Obra) => {
    setEditingObra(obr);
    setFormData({
      codigo: obr.codigo,
      nome: obr.nome,
      cliente: obr.cliente,
      localizacao: obr.localizacao,
      estado: obr.estado,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ['#2563eb', '#059669', '#d97706', '#9333ea', '#dc2626', '#0891b2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const obraToSave: Obra = {
      id: editingObra ? editingObra.id : `obr-${Date.now()}`,
      codigo: formData.codigo.trim(),
      nome: formData.nome.trim(),
      cliente: formData.cliente.trim(),
      localizacao: formData.localizacao.trim(),
      estado: formData.estado,
      dataInicio: editingObra ? editingObra.dataInicio : new Date().toISOString().split('T')[0],
      cor: editingObra ? editingObra.cor : randomColor,
    };

    onSaveObra(obraToSave);
    setIsModalOpen(false);
  };

  const filteredObras = obras.filter((o) => {
    if (filter === 'todas') return true;
    return o.estado === filter;
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Obras & Estaleiros</h2>
          <p className="text-xs text-slate-500">Gestão dos postos de trabalho</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nova Obra</span>
        </button>
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'em_curso', label: 'Em Curso' },
          { id: 'pausada', label: 'Pausadas' },
          { id: 'concluida', label: 'Concluídas' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === item.id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Obras Grid / List */}
      <div className="space-y-3">
        {filteredObras.map((obr) => {
          // Total de horas acumuladas nesta obra em todo o histórico
          const obraRegistos = registos.filter((r) => r.obraId === obr.id);
          const totalHoras = obraRegistos.reduce(
            (acc, curr) => acc + (curr.horasNormais || 0) + (curr.horasExtra || 0),
            0
          );

          return (
            <div
              key={obr.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {obr.codigo}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{obr.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{obr.cliente}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {obr.localizacao}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(obr)}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteObra(obr.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Estatísticas e Estado da Obra */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      obr.estado === 'em_curso'
                        ? 'bg-emerald-50 text-emerald-700'
                        : obr.estado === 'concluida'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {obr.estado === 'em_curso' ? (
                      <>
                        <PlayCircle className="w-3 h-3" /> Em Curso
                      </>
                    ) : obr.estado === 'concluida' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Concluída
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3 h-3" /> Pausada
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {obraRegistos.length} registo{obraRegistos.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-bold text-slate-900 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{totalHoras.toFixed(1)} h acumuladas</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar / Editar Obra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingObra ? 'Editar Obra' : 'Adicionar Nova Obra'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código / Ref.
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: OBR-24-09"
                    className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="em_curso">Em Curso</option>
                    <option value="pausada">Pausada</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Obra</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Ampliação Pavilhão de Produção"
                  className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cliente / Dono de Obra</label>
                <input
                  type="text"
                  required
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  placeholder="Ex: Mota-Engil / Teixeira Duarte"
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Localização</label>
                <input
                  type="text"
                  required
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Maia, Porto"
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 min-h-[44px] shadow-sm"
                >
                  {editingObra ? 'Guardar Alterações' : 'Criar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
