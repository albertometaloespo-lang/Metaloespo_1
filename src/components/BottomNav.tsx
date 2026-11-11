import { CalendarDays, Building2, Users, BarChart3, Cloud, ShieldCheck, UserCheck } from 'lucide-react';
import { ViewTab, UserRole } from '../types';

interface BottomNavProps {
  currentTab: ViewTab;
  userRole: UserRole;
  isDriveConnected: boolean;
  onTabChange: (tab: ViewTab) => void;
  onPromptAdmin: () => void;
  onOpenWorkerLogin?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  userRole,
  isDriveConnected,
  onTabChange,
  onPromptAdmin,
  onOpenWorkerLogin,
}) => {
  // Se for colaborador, tem acesso apenas ao Registo de Horas e à troca de perfil/admin
  if (userRole === 'colaborador') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center h-16 px-2">
          <button
            onClick={() => onTabChange('registo')}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
              currentTab === 'registo' ? 'text-amber-600 font-bold' : 'text-slate-500'
            }`}
          >
            <CalendarDays className="w-5 h-5 stroke-[2.2px]" />
            <span className="text-[11px] tracking-tight mt-1">Meu Registo</span>
          </button>

          <button
            onClick={onOpenWorkerLogin}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <UserCheck className="w-5 h-5 stroke-[1.8px] text-slate-400" />
            <span className="text-[11px] tracking-tight mt-1 text-slate-600">Trocar Perfil</span>
          </button>

          <button
            onClick={onPromptAdmin}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ShieldCheck className="w-5 h-5 stroke-[1.8px] text-slate-400" />
            <span className="text-[11px] tracking-tight mt-1 text-slate-600">Área Admin</span>
          </button>
        </div>
      </nav>
    );
  }

  // Visão completa do Administrador
  const tabs = [
    { id: 'registo' as ViewTab, label: 'Registo', icon: CalendarDays },
    { id: 'obras' as ViewTab, label: 'Obras', icon: Building2 },
    { id: 'equipa' as ViewTab, label: 'Equipa', icon: Users },
    { id: 'relatorios' as ViewTab, label: 'Relatórios', icon: BarChart3 },
    {
      id: 'drive' as ViewTab,
      label: 'Drive Central',
      icon: Cloud,
      hasDot: isDriveConnected,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
                  }`}
                />
                {tab.hasDot && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
