import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Colaborador,
  Obra,
  RegistoHoras,
  GoogleSyncConfig,
  ViewTab,
  UserRole,
  ValidacaoDia,
} from './types';
import { StorageService } from './services/storage';
import { initAuth, googleSignIn, googleLogout, getCurrentUser } from './services/googleAuth';
import { GoogleSheetsService } from './services/googleSheets';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DateSelector } from './components/DateSelector';
import { DailyLogView } from './components/DailyLogView';
import { ObrasView } from './components/ObrasView';
import { TeamView } from './components/TeamView';
import { ReportsView } from './components/ReportsView';
import { DriveSyncView } from './components/DriveSyncView';
import { WorkerLogModal } from './components/WorkerLogModal';
import { BatchObraLogModal } from './components/BatchObraLogModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminPinModal } from './components/AdminPinModal';
import { MobileTestModal } from './components/MobileTestModal';
import { CollaboratorLoginModal } from './components/CollaboratorLoginModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(() =>
    StorageService.getColaboradores()
  );
  const [obras, setObras] = useState<Obra[]>(() => StorageService.getObras());
  const [registos, setRegistos] = useState<RegistoHoras[]>(() => StorageService.getRegistos());
  const [syncConfig, setSyncConfig] = useState<GoogleSyncConfig>(() =>
    StorageService.getSyncConfig()
  );
  const [validacoes, setValidacoes] = useState<Record<string, ValidacaoDia>>(() =>
    StorageService.getValidacoes()
  );

  // Perfil do Utilizador: padrão 'colaborador' (acesso apenas ao registo de horas)
  const [userRole, setUserRole] = useState<UserRole>(() =>
    StorageService.isAdminMode() ? 'administrador' : 'colaborador'
  );

  // Identidade do Colaborador com sessão iniciada (acesso exclusivo às suas horas)
  const [currentWorkerId, setCurrentWorkerId] = useState<string | null>(() =>
    StorageService.getCurrentWorkerId()
  );
  const [isWorkerLoginModalOpen, setIsWorkerLoginModalOpen] = useState<boolean>(false);

  const currentWorker = colaboradores.find((c) => c.id === currentWorkerId) || null;

  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [currentTab, setCurrentTab] = useState<ViewTab>('registo');

  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modais
  const [activeWorkerForModal, setActiveWorkerForModal] = useState<Colaborador | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [syncNotification, setSyncNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Inicializar listener de autenticação Firebase
  useEffect(() => {
    const unsubscribe = initAuth(
      (loggedUser) => {
        setUser(loggedUser);
        // Se a conta iniciada corresponder ao proprietário da app, pode ativar automaticamente modo admin
        if (loggedUser.email === 'alberto.metaloespo@gmail.com') {
          setUserRole('administrador');
          StorageService.setAdminMode(true);
        }
      },
      () => setUser(null)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Detetar se foi passado um link pessoal de colaborador (#worker=col-X&pin=YYYY) ou folha central
  useEffect(() => {
    try {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const urlParams = new URLSearchParams(window.location.search);

      const workerParam = hashParams.get('worker') || urlParams.get('worker');
      const pinParam = hashParams.get('pin') || urlParams.get('pin');
      const sheetIdParam = hashParams.get('sheetId') || urlParams.get('sheetId');

      if (sheetIdParam && sheetIdParam !== syncConfig.spreadsheetId) {
        const updatedConfig: GoogleSyncConfig = {
          ...syncConfig,
          spreadsheetId: sheetIdParam,
          spreadsheetName: syncConfig.spreadsheetName || 'Folha Central da Empresa',
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetIdParam}`,
        };
        setSyncConfig(updatedConfig);
        StorageService.saveSyncConfig(updatedConfig);
      }

      if (workerParam) {
        const matchedWorker = colaboradores.find((c) => c.id === workerParam);
        if (matchedWorker) {
          if (!pinParam || matchedWorker.pin === pinParam) {
            setCurrentWorkerId(matchedWorker.id);
            StorageService.setCurrentWorkerId(matchedWorker.id);
            setUserRole('colaborador');
            StorageService.setAdminMode(false);
            setSyncNotification({
              type: 'success',
              text: `Bem-vindo, ${matchedWorker.nome}! Acesso móvel ao teu registo de horas ativo.`,
            });
            setTimeout(() => setSyncNotification(null), 5000);
          }
        }
      }
    } catch (e) {
      console.warn('URL parameters check:', e);
    }
  }, [colaboradores]);

  // Sincronização periódica com a Base de Dados Central no Google Drive
  useEffect(() => {
    if (!user || !syncConfig.spreadsheetId || !syncConfig.autoSync) return;

    const pullLatest = async () => {
      try {
        const remote = await GoogleSheetsService.readSpreadsheetData(syncConfig.spreadsheetId!);
        if (remote.registos.length > 0 || remote.colaboradores.length > 0) {
          setColaboradores(remote.colaboradores);
          setObras(remote.obras);
          setRegistos(remote.registos);
          setValidacoes(remote.validacoes);
          StorageService.saveColaboradores(remote.colaboradores);
          StorageService.saveObras(remote.obras);
          StorageService.saveRegistos(remote.registos);
          StorageService.saveAllValidacoes(remote.validacoes);
        }
      } catch (err) {
        // Silently catch background poll issues
      }
    };

    const onFocus = () => {
      pullLatest();
    };
    window.addEventListener('focus', onFocus);
    const timer = setInterval(pullLatest, 90000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [user, syncConfig.spreadsheetId, syncConfig.autoSync]);

  const handleSelectWorker = (worker: Colaborador) => {
    setCurrentWorkerId(worker.id);
    StorageService.setCurrentWorkerId(worker.id);
    setUserRole('colaborador');
    StorageService.setAdminMode(false);
    setSyncNotification({
      type: 'success',
      text: `Sessão ativa como ${worker.nome} (Acesso exclusivo ao teu registo).`,
    });
    setTimeout(() => setSyncNotification(null), 3500);
  };

  // Verificar se o dia atual está bloqueado
  const isSelectedDayLocked = Boolean(validacoes[selectedDate]?.bloqueado);

  // Sincronização automática para a Base de Dados Central no Google Sheets
  const autoSyncToDrive = async (
    newRegistos: RegistoHoras[],
    newCols: Colaborador[],
    newObras: Obra[],
    newValidacoes?: Record<string, ValidacaoDia>
  ) => {
    if (syncConfig.spreadsheetId && syncConfig.autoSync && user) {
      try {
        setIsSyncing(true);
        await GoogleSheetsService.syncAllToSpreadsheet(
          syncConfig.spreadsheetId,
          newCols,
          newObras,
          newRegistos,
          newValidacoes || validacoes
        );
        const updatedConfig = {
          ...syncConfig,
          lastSyncTime: new Date().toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setSyncConfig(updatedConfig);
        StorageService.saveSyncConfig(updatedConfig);
      } catch (err) {
        console.warn('Auto-sync aviso:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // COMANDO ADMINISTRADOR: Validar e Bloquear o Registo do Dia
  const handleValidateAndLockDay = () => {
    const adminName = user?.displayName || user?.email || 'Administrador';
    const hora = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    setConfirmDialog({
      isOpen: true,
      title: 'Validar e Bloquear Registos',
      message: `Tem a certeza que deseja validar e bloquear os registos de ${selectedDate}? Os colaboradores não poderão efetuar mais alterações a este dia.`,
      onConfirm: () => {
        const validation: ValidacaoDia = {
          data: selectedDate,
          bloqueado: true,
          validadoPor: adminName,
          validadoEm: hora,
        };
        StorageService.saveValidacao(validation);
        const updatedValidacoes = StorageService.getValidacoes();
        setValidacoes(updatedValidacoes);

        // Marcar registos do dia como validados
        const updated = registos.map((r) =>
          r.data === selectedDate ? { ...r, validado: true, bloqueado: true, validadoPor: adminName, validadoEm: hora } : r
        );
        setRegistos(updated);
        StorageService.saveRegistos(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive(updated, colaboradores, obras, updatedValidacoes);
      },
    });
  };

  // COMANDO ADMINISTRADOR: Desbloquear o Registo do Dia
  const handleUnlockDay = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Desbloquear Registos para Edição',
      message: `Deseja desbloquear os registos de ${selectedDate} para permitir alterações?`,
      onConfirm: () => {
        StorageService.removeValidacao(selectedDate);
        const updatedValidacoes = StorageService.getValidacoes();
        setValidacoes(updatedValidacoes);

        const updated = registos.map((r) =>
          r.data === selectedDate ? { ...r, bloqueado: false } : r
        );
        setRegistos(updated);
        StorageService.saveRegistos(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive(updated, colaboradores, obras, updatedValidacoes);
      },
    });
  };

  // Alternar Papel (Colaborador vs Administrador)
  const handleToggleRole = () => {
    if (userRole === 'administrador') {
      setUserRole('colaborador');
      StorageService.setAdminMode(false);
      setCurrentTab('registo');
    } else {
      // Se for o administrador logado pelo Google, entra direto
      if (user?.email === 'alberto.metaloespo@gmail.com') {
        setUserRole('administrador');
        StorageService.setAdminMode(true);
      } else {
        setIsAdminPinModalOpen(true);
      }
    }
  };

  // Guardar registos de um colaborador (suporta MÚLTIPLAS obras por dia)
  const handleSaveWorkerAllocations = (allocations: any[]) => {
    if (!activeWorkerForModal) return;

    // Se estiver bloqueado e não for administrador, impede guardar
    if (isSelectedDayLocked && userRole !== 'administrador') {
      return;
    }

    const workerId = activeWorkerForModal.id;

    // Remover os registos antigos deste colaborador nesta data
    const remaining = registos.filter(
      (r) => !(r.colaboradorId === workerId && r.data === selectedDate)
    );

    // Criar os novos registos (cada obra é um registo no mesmo dia)
    const newItems: RegistoHoras[] = allocations.map((alloc) => ({
      id: alloc.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data: selectedDate,
      colaboradorId: workerId,
      obraId: alloc.obraId,
      horasNormais: Number(alloc.horasNormais) || 0,
      horasExtra: Number(alloc.horasExtra) || 0,
      descricao: alloc.descricao || '',
      validado: isSelectedDayLocked,
      bloqueado: isSelectedDayLocked,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }));

    const updatedRegistos = [...remaining, ...newItems];
    setRegistos(updatedRegistos);
    StorageService.saveRegistos(updatedRegistos);

    // Sincronizar com Drive em segundo plano
    autoSyncToDrive(updatedRegistos, colaboradores, obras);
  };

  // Guardar registo em lote de equipa por obra
  const handleSaveBatchAllocations = (
    obraId: string,
    workerLogs: {
      colaboradorId: string;
      horasNormais: number;
      horasExtra: number;
      descricao: string;
    }[]
  ) => {
    if (isSelectedDayLocked && userRole !== 'administrador') return;

    const selectedWorkerIds = new Set(workerLogs.map((w) => w.colaboradorId));

    // Remover registos anteriores destes colaboradores NESTA obra nesta data
    const remaining = registos.filter(
      (r) => !(r.data === selectedDate && r.obraId === obraId && selectedWorkerIds.has(r.colaboradorId))
    );

    const newItems: RegistoHoras[] = workerLogs.map((item) => ({
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data: selectedDate,
      colaboradorId: item.colaboradorId,
      obraId: obraId,
      horasNormais: item.horasNormais,
      horasExtra: item.horasExtra,
      descricao: item.descricao,
      validado: isSelectedDayLocked,
      bloqueado: isSelectedDayLocked,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }));

    const updated = [...remaining, ...newItems];
    setRegistos(updated);
    StorageService.saveRegistos(updated);

    autoSyncToDrive(updated, colaboradores, obras);
  };

  // Gestão de Obras
  const handleSaveObra = (obraToSave: Obra) => {
    const exists = obras.some((o) => o.id === obraToSave.id);
    const updated = exists
      ? obras.map((o) => (o.id === obraToSave.id ? obraToSave : o))
      : [...obras, obraToSave];

    setObras(updated);
    StorageService.saveObras(updated);
    autoSyncToDrive(registos, colaboradores, updated);
  };

  const handleDeleteObra = (obraId: string) => {
    const obr = obras.find((o) => o.id === obraId);
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Obra',
      message: `Tem a certeza que deseja eliminar a obra "${obr?.codigo} - ${obr?.nome}"? Os registos de horas associados serão mantidos.`,
      onConfirm: () => {
        const updated = obras.filter((o) => o.id !== obraId);
        setObras(updated);
        StorageService.saveObras(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive(registos, colaboradores, updated);
      },
    });
  };

  // Gestão de Colaboradores
  const handleSaveColaborador = (colToSave: Colaborador) => {
    const exists = colaboradores.some((c) => c.id === colToSave.id);
    const updated = exists
      ? colaboradores.map((c) => (c.id === colToSave.id ? colToSave : c))
      : [...colaboradores, colToSave];

    setColaboradores(updated);
    StorageService.saveColaboradores(updated);
    autoSyncToDrive(registos, updated, obras);
  };

  const handleDeleteColaborador = (colId: string) => {
    const col = colaboradores.find((c) => c.id === colId);
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Colaborador',
      message: `Tem a certeza que deseja eliminar o colaborador "${col?.nome}"?`,
      onConfirm: () => {
        const updated = colaboradores.filter((c) => c.id !== colId);
        setColaboradores(updated);
        StorageService.saveColaboradores(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive(registos, updated, obras);
      },
    });
  };

  // COMANDO ADMINISTRADOR: Limpar Todos os Registos de Horas
  const handleClearAllRegistos = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Todos os Registos de Horas',
      message:
        'Tem a certeza de que deseja apagar permanentemente todos os registos de horas de todos os colaboradores? O histórico de horas e validações será completamente limpo.',
      onConfirm: () => {
        StorageService.clearAllRegistos();
        setRegistos([]);
        setValidacoes({});
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive([], colaboradores, obras);
      },
    });
  };

  // COMANDO ADMINISTRADOR: Limpar Registos do Dia Selecionado
  const handleClearDayRegistos = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Registos do Dia',
      message: `Tem a certeza que deseja apagar todos os registos do dia ${selectedDate}?`,
      onConfirm: () => {
        const remaining = registos.filter((r) => r.data !== selectedDate);
        setRegistos(remaining);
        StorageService.saveRegistos(remaining);
        StorageService.removeValidacao(selectedDate);
        setValidacoes(StorageService.getValidacoes());
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToDrive(remaining, colaboradores, obras);
      },
    });
  };

  // Repor dados
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Repor Dados de Demonstração',
      message:
        'Isto irá repor as obras, colaboradores e registos para os valores de exemplo. Deseja continuar?',
      onConfirm: () => {
        StorageService.resetAllData();
        setColaboradores(StorageService.getColaboradores());
        setObras(StorageService.getObras());
        setRegistos(StorageService.getRegistos());
        setValidacoes(StorageService.getValidacoes());
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Autenticação Google com Configuração Automática da Base de Dados Central no Google Drive
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setUser(res.user);
        if (res.user.email === 'alberto.metaloespo@gmail.com') {
          setUserRole('administrador');
          StorageService.setAdminMode(true);
        }

        setIsSyncing(true);
        try {
          const central = await GoogleSheetsService.ensureCentralSpreadsheet(
            colaboradores,
            obras,
            registos,
            validacoes
          );

          const updatedCfg: GoogleSyncConfig = {
            ...syncConfig,
            spreadsheetId: central.id,
            spreadsheetName: central.name,
            spreadsheetUrl: central.url,
            lastSyncTime: new Date().toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          setSyncConfig(updatedCfg);
          StorageService.saveSyncConfig(updatedCfg);

          // Ler dados consolidados da folha central
          const remoteData = await GoogleSheetsService.readSpreadsheetData(central.id);
          if (remoteData.registos.length > 0 || remoteData.colaboradores.length > 0) {
            setColaboradores(remoteData.colaboradores);
            setObras(remoteData.obras);
            setRegistos(remoteData.registos);
            setValidacoes(remoteData.validacoes);
            StorageService.saveColaboradores(remoteData.colaboradores);
            StorageService.saveObras(remoteData.obras);
            StorageService.saveRegistos(remoteData.registos);
            StorageService.saveAllValidacoes(remoteData.validacoes);
          }

          setSyncNotification({
            type: 'success',
            text: central.isNew
              ? `Base de dados central criada no Google Drive ("${central.name}") e ligada com sucesso!`
              : `Ligado à Base de Dados Central no Google Drive ("${central.name}"). Dados sincronizados!`,
          });
          setTimeout(() => setSyncNotification(null), 5000);
        } catch (autoErr: any) {
          console.warn('Configuração de base central no Drive:', autoErr);
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    setUser(null);
  };

  const handleUpdateSyncConfig = (cfg: GoogleSyncConfig) => {
    setSyncConfig(cfg);
    StorageService.saveSyncConfig(cfg);
  };

  // Sincronização Completa e Bidirecional com a Base de Dados Central no Google Drive
  const handleSyncNow = async () => {
    if (!syncConfig.spreadsheetId) {
      handleTabChange('drive');
      return;
    }
    setIsSyncing(true);
    setSyncNotification(null);
    try {
      const merged = await GoogleSheetsService.syncBidirectional(
        syncConfig.spreadsheetId,
        colaboradores,
        obras,
        registos,
        validacoes
      );

      setColaboradores(merged.colaboradores);
      setObras(merged.obras);
      setRegistos(merged.registos);
      setValidacoes(merged.validacoes);
      StorageService.saveColaboradores(merged.colaboradores);
      StorageService.saveObras(merged.obras);
      StorageService.saveRegistos(merged.registos);
      StorageService.saveAllValidacoes(merged.validacoes);

      const updated = {
        ...syncConfig,
        lastSyncTime: new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setSyncConfig(updated);
      StorageService.saveSyncConfig(updated);
      setSyncNotification({
        type: 'success',
        text: `Base de dados central atualizada no Google Drive! ${merged.syncedCount} registos sincronizados.`,
      });
      setTimeout(() => setSyncNotification(null), 5000);
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      setSyncNotification({
        type: 'error',
        text: err.message || 'Erro ao sincronizar com a base de dados central no Google Drive.',
      });
      setTimeout(() => setSyncNotification(null), 6000);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Descarregar dados da Base de Dados Central (Sobrescrever local com o Drive)
  const handlePullFromDrive = async () => {
    if (!syncConfig.spreadsheetId) return;
    setIsSyncing(true);
    try {
      const remote = await GoogleSheetsService.readSpreadsheetData(syncConfig.spreadsheetId);
      setColaboradores(remote.colaboradores);
      setObras(remote.obras);
      setRegistos(remote.registos);
      setValidacoes(remote.validacoes);
      StorageService.saveColaboradores(remote.colaboradores);
      StorageService.saveObras(remote.obras);
      StorageService.saveRegistos(remote.registos);
      StorageService.saveAllValidacoes(remote.validacoes);

      const updated = {
        ...syncConfig,
        lastSyncTime: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      };
      setSyncConfig(updated);
      StorageService.saveSyncConfig(updated);
      setSyncNotification({
        type: 'success',
        text: `Dados descarregados com sucesso do Google Drive (${remote.registos.length} registos).`,
      });
      setTimeout(() => setSyncNotification(null), 4500);
    } catch (err: any) {
      setSyncNotification({
        type: 'error',
        text: err.message || 'Erro ao descarregar dados do Drive.',
      });
      setTimeout(() => setSyncNotification(null), 6000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Forçar envio de todos os dados locais para a Base de Dados Central no Google Drive
  const handlePushToDrive = async () => {
    if (!syncConfig.spreadsheetId) return;
    setIsSyncing(true);
    try {
      await GoogleSheetsService.syncAllToSpreadsheet(
        syncConfig.spreadsheetId,
        colaboradores,
        obras,
        registos,
        validacoes
      );
      const updated = {
        ...syncConfig,
        lastSyncTime: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      };
      setSyncConfig(updated);
      StorageService.saveSyncConfig(updated);
      setSyncNotification({
        type: 'success',
        text: `Todos os dados locais foram enviados para a base central no Google Drive.`,
      });
      setTimeout(() => setSyncNotification(null), 4500);
    } catch (err: any) {
      setSyncNotification({
        type: 'error',
        text: err.message || 'Erro ao enviar dados para o Drive.',
      });
      setTimeout(() => setSyncNotification(null), 6000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Se o utilizador for 'colaborador', restringir abas que não sejam 'registo'
  const handleTabChange = (tab: ViewTab) => {
    if (userRole === 'colaborador' && tab !== 'registo') {
      setIsAdminPinModalOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        syncConfig={syncConfig}
        isSyncing={isSyncing}
        userRole={userRole}
        currentWorker={currentWorker}
        onOpenWorkerLogin={() => setIsWorkerLoginModalOpen(true)}
        onQuickSync={syncConfig.spreadsheetId ? handleSyncNow : undefined}
        onOpenDriveTab={() => handleTabChange('drive')}
        onToggleRole={handleToggleRole}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
      />

      {/* Notificação / Toast de Sincronização entre Aplicações */}
      {syncNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-in fade-in slide-in-from-top-2">
          <div
            className={`p-3 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs font-semibold ${
              syncNotification.type === 'success'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{syncNotification.text}</span>
            </div>
            <button
              onClick={() => setSyncNotification(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Date Selector (visível no ecrã de Registo Diário) */}
      {currentTab === 'registo' && (
        <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'registo' && (
          <DailyLogView
            selectedDate={selectedDate}
            userRole={userRole}
            isDayLocked={isSelectedDayLocked}
            dayValidation={validacoes[selectedDate]}
            colaboradores={colaboradores}
            obras={obras}
            registos={registos}
            currentWorker={currentWorker}
            onSwitchAccount={() => setIsWorkerLoginModalOpen(true)}
            onOpenWorkerModal={(col) => setActiveWorkerForModal(col)}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onValidateAndLockDay={handleValidateAndLockDay}
            onUnlockDay={handleUnlockDay}
            onPromptAdmin={() => setIsAdminPinModalOpen(true)}
            onClearDayRegistos={handleClearDayRegistos}
          />
        )}

        {currentTab === 'obras' && userRole === 'administrador' && (
          <ObrasView
            obras={obras}
            registos={registos}
            onSaveObra={handleSaveObra}
            onDeleteObra={handleDeleteObra}
          />
        )}

        {currentTab === 'equipa' && userRole === 'administrador' && (
          <TeamView
            colaboradores={colaboradores}
            registos={registos}
            onSaveColaborador={handleSaveColaborador}
            onDeleteColaborador={handleDeleteColaborador}
            syncConfig={syncConfig}
          />
        )}

        {currentTab === 'relatorios' && userRole === 'administrador' && (
          <ReportsView
            colaboradores={colaboradores}
            obras={obras}
            registos={registos}
            onClearAllRegistos={handleClearAllRegistos}
          />
        )}

        {currentTab === 'drive' && userRole === 'administrador' && (
          <DriveSyncView
            user={user}
            syncConfig={syncConfig}
            colaboradores={colaboradores}
            obras={obras}
            registos={registos}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onUpdateSyncConfig={handleUpdateSyncConfig}
            onSyncNow={handleSyncNow}
            onPullFromDrive={handlePullFromDrive}
            onPushToDrive={handlePushToDrive}
            validacoes={validacoes}
            onResetData={handleResetData}
            onClearAllRegistos={handleClearAllRegistos}
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        userRole={userRole}
        onTabChange={handleTabChange}
        isDriveConnected={!!syncConfig.spreadsheetId}
        onPromptAdmin={() => setIsAdminPinModalOpen(true)}
        onOpenWorkerLogin={() => setIsWorkerLoginModalOpen(true)}
      />

      {/* Modal: Registo Individual do Colaborador (MÚLTIPLAS OBRAS POR DIA) */}
      {activeWorkerForModal && (
        <WorkerLogModal
          isOpen={true}
          onClose={() => setActiveWorkerForModal(null)}
          colaborador={activeWorkerForModal}
          date={selectedDate}
          obras={obras}
          initialRegistos={registos.filter(
            (r) => r.colaboradorId === activeWorkerForModal.id && r.data === selectedDate
          )}
          isLocked={isSelectedDayLocked}
          userRole={userRole}
          onSave={handleSaveWorkerAllocations}
        />
      )}

      {/* Modal: Registo em Lote por Obra */}
      {isBatchModalOpen && (
        <BatchObraLogModal
          isOpen={true}
          onClose={() => setIsBatchModalOpen(false)}
          date={selectedDate}
          obras={obras}
          colaboradores={colaboradores.filter((c) => c.ativo)}
          existingRegistos={registos}
          isLocked={isSelectedDayLocked}
          onSaveBatch={handleSaveBatchAllocations}
        />
      )}

      {/* Modal de Confirmação para Ações Destrutivas ou Bloqueio */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal de PIN de Administrador */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setUserRole('administrador');
          StorageService.setAdminMode(true);
        }}
      />

      {/* Modal de Login de Colaborador (Acesso Exclusivo com PIN) */}
      <CollaboratorLoginModal
        isOpen={isWorkerLoginModalOpen}
        onClose={() => setIsWorkerLoginModalOpen(false)}
        colaboradores={colaboradores}
        onSelectWorker={handleSelectWorker}
        onSwitchToAdmin={() => setIsAdminPinModalOpen(true)}
        currentWorkerId={currentWorkerId}
      />

      {/* Modal para Testar no Telemóvel (QR Code e Guia PWA) */}
      <MobileTestModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        spreadsheetId={syncConfig.spreadsheetId}
      />
    </div>
  );
}
