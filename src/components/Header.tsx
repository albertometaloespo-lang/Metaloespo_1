import React from 'react';
import {
  HardHat,
  Cloud,
  CloudCheck,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  Smartphone,
} from 'lucide-react';
import { GoogleSyncConfig, UserRole, Colaborador } from '../types';

interface HeaderProps {
  syncConfig: GoogleSyncConfig;
  isSyncing: boolean;
  userRole: UserRole;
  currentWorker?: Colaborador | null;
  onOpenWorkerLogin: () => void;
  onQuickSync?: () => void;
  onOpenDriveTab: () => void;
  onToggleRole: () => void;
  onOpenMobileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncConfig,
  isSyncing,
  userRole,
  currentWorker,
  onOpenWorkerLogin,
  onQuickSync,
  onOpenDriveTab,
  onToggleRole,
  onOpenMobileModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <HardHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              ObraTempo
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Registo Diário de Horas</p>
          </div>
        </div>

        {/* Right Zone: Telemóvel + Role Pill + Google Drive */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão Testar no Telemóvel */}
          <button
            onClick={onOpenMobileModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
            title="Abrir código QR para testar no telemóvel"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Telemóvel</span>
          </button>

          {/* Modo Administrador ou Perfil do Colaborador com PIN */}
          {userRole === 'administrador' ? (
            <button
              onClick={onToggleRole}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs transition-all cursor-pointer min-h-[36px]"
              title="Modo Administrador ativo. Toque para mudar para modo colaborador."
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {currentWorker ? (
                <button
                  onClick={onOpenWorkerLogin}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-400 text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
                  title={`Sessão iniciada como ${currentWorker.nome} (PIN: ${currentWorker.pin}). Toque para trocar de colaborador.`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                    style={{ backgroundColor: currentWorker.cor }}
                  >
                    {currentWorker.nome.charAt(0)}
                  </span>
                  <span className="text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate">
                    {currentWorker.nome.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenWorkerLogin}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold">Entrar (PIN)</span>
                </button>
              )}

              <button
                onClick={onToggleRole}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Aceder à Administração"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botão de Sincronização com a Base de Dados Central no Google Drive */}
          {syncConfig.spreadsheetId ? (
            <button
              onClick={onQuickSync || onOpenDriveTab}
              disabled={isSyncing}
              title={`Base de Dados Central no Google Drive: ${syncConfig.spreadsheetName || 'Folha Central'}. Toque para sincronizar.`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700/90 border border-emerald-500/40 text-xs text-white transition-all cursor-pointer min-h-[36px] shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-[11px] font-bold">
                {isSyncing ? 'A sincronizar...' : 'Drive Central'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenDriveTab}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              title="Ligar à Base de Dados Central no Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="text-[11px]">Ligar Drive</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
