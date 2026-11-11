import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Clock,
  Edit2,
  Trash2,
  X,
  UserCheck,
  UserX,
  KeyRound,
  Share2,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { Colaborador, RegistoHoras, GoogleSyncConfig } from '../types';
import { ShareWorkerAccessModal } from './ShareWorkerAccessModal';

interface TeamViewProps {
  colaboradores: Colaborador[];
  registos: RegistoHoras[];
  onSaveColaborador: (col: Colaborador) => void;
  onDeleteColaborador: (colId: string) => void;
  syncConfig: GoogleSyncConfig;
}

export const TeamView: React.FC<TeamViewProps> = ({
  colaboradores,
  registos,
  onSaveColaborador,
  onDeleteColaborador,
  syncConfig,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [sharingColaborador, setSharingColaborador] = useState<Colaborador | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    contacto: '',
    horasBaseDia: 8,
    ativo: true,
    pin: '',
  });

  const getSuggestedPin = () => {
    const existingPins = colaboradores.map((c) => parseInt(c.pin, 10)).filter((p) => !isNaN(p));
    const maxPin = existingPins.length > 0 ? Math.max(...existingPins) : 1000;
    return String(maxPin + 1);
  };

  const handleOpenAdd = () => {
    setEditingColaborador(null);
    setFormData({
      nome: '',
      funcao: '',
      contacto: '',
      horasBaseDia: 8,
      ativo: true,
      pin: getSuggestedPin(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Colaborador) => {
    setEditingColaborador(col);
    setFormData({
      nome: col.nome,
      funcao: col.funcao,
      contacto: col.contacto || '',
      horasBaseDia: col.horasBaseDia,
      ativo: col.ativo,
      pin: col.pin || getSuggestedPin(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#0891b2', '#ca8a04', '#e11d48'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const colToSave: Colaborador = {
      id: editingColaborador ? editingColaborador.id : `col-${Date.now()}`,
      nome: formData.nome.trim(),
      funcao: formData.funcao.trim(),
      contacto: formData.contacto.trim(),
      horasBaseDia: formData.horasBaseDia,
      ativo: formData.ativo,
      pin: formData.pin.trim() || getSuggestedPin(),
      cor: editingColaborador ? editingColaborador.cor : randomColor,
    };

    onSaveColaborador(colToSave);
    setIsModalOpen(false);
  };

  // Obter o mês atual para o total de horas
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Equipa & Colaboradores</h2>
          <p className="text-xs text-slate-500">
            {colaboradores.filter((c) => c.ativo).length} ativos · {colaboradores.length} no total
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Novo Colaborador</span>
        </button>
      </div>

      {/* Lista de Colaboradores */}
      <div className="space-y-2.5">
        {colaboradores.map((col) => {
          // Total de horas deste colaborador este mês
          const monthRegistos = registos.filter(
            (r) => r.colaboradorId === col.id && r.data.startsWith(currentMonthPrefix)
          );
          const totalHorasMes = monthRegistos.reduce(
            (acc, curr) => acc + (curr.horasNormais || 0) + (curr.horasExtra || 0),
            0
          );
          const totalExtraMes = monthRegistos.reduce(
            (acc, curr) => acc + (curr.horasExtra || 0),
            0
          );

          return (
            <div
              key={col.id}
              className={`p-3.5 rounded-2xl bg-white border transition-all ${
                col.ativo
                  ? 'border-slate-200/90 shadow-2xs'
                  : 'border-slate-200/50 bg-slate-50/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0"
                    style={{ backgroundColor: col.cor }}
                  >
                    {col.nome
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{col.nome}</h3>
                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                        PIN: {col.pin}
                      </span>
                      {!col.ativo && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{col.funcao}</p>
                    {col.contacto && (
                      <a
                        href={`tel:${col.contacto.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-600 mt-0.5 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{col.contacto}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSharingColaborador(col)}
                    title="Partilhar link e QR de acesso para telemóvel"
                    className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors border border-amber-200"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(col)}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteColaborador(col.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informação de Horas do Mês e Acesso Rápido */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Horas ({new Date().toLocaleDateString('pt-PT', { month: 'short' })}):
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{totalHorasMes.toFixed(1)} h</span>
                  {totalExtraMes > 0 && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                      +{totalExtraMes}h extra
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSharingColaborador(col)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Acesso Móvel</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar / Editar Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingColaborador ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Manuel Ribeiro"
                  className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Função / Especialidade
                </label>
                <input
                  type="text"
                  required
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  placeholder="Ex: Serralheiro Mecânico, Soldador, Chefe de Equipa..."
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
                />
              </div>

              {/* PIN Pessoal do Colaborador */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  PIN Pessoal de Acesso (4 dígitos)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })
                    }
                    placeholder="Ex: 1001"
                    className="w-36 text-sm font-mono font-bold tracking-widest text-slate-900 rounded-lg border border-amber-300 px-3 py-1.5 bg-white shadow-inner"
                  />
                  <span className="text-[11px] text-amber-800 leading-tight">
                    Utilizado pelo colaborador para entrar no telemóvel e ver unicamente as suas horas.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    placeholder="Ex: 912 345 678"
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horas Base / Dia</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={formData.horasBaseDia}
                    onChange={(e) =>
                      setFormData({ ...formData, horasBaseDia: parseInt(e.target.value) || 8 })
                    }
                    className="w-full text-xs sm:text-sm font-bold rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="col-ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="col-ativo" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Colaborador Ativo no Quadro da Empresa
                </label>
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
                  {editingColaborador ? 'Guardar' : 'Criar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Partilhar Acesso Móvel */}
      {sharingColaborador && (
        <ShareWorkerAccessModal
          isOpen={!!sharingColaborador}
          onClose={() => setSharingColaborador(null)}
          colaborador={sharingColaborador}
          syncConfig={syncConfig}
        />
      )}
    </div>
  );
};
