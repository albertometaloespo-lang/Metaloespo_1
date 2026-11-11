import { Colaborador, Obra, RegistoHoras, GoogleSyncConfig, ValidacaoDia } from '../types';

const STORAGE_KEYS = {
  COLABORADORES: 'obratempo_colaboradores_v1',
  OBRAS: 'obratempo_obras_v1',
  REGISTOS: 'obratempo_registos_v2',
  SYNC_CONFIG: 'obratempo_sync_config_v1',
  VALIDACOES: 'obratempo_validacoes_v2',
  ADMIN_PIN: 'obratempo_admin_pin_v1',
  ADMIN_MODE: 'obratempo_admin_mode_v1',
  CURRENT_WORKER_ID: 'obratempo_current_worker_id_v1',
  CLEANUP_FLAG: 'obratempo_registos_wiped_v2',
};

// Dados realistas de colaboradores para a empresa
const SEED_COLABORADORES: Colaborador[] = [
  {
    id: 'col-1',
    nome: 'Manuel Ribeiro',
    funcao: 'Chefe de Equipa / Montador',
    contacto: '914 220 311',
    ativo: true,
    horasBaseDia: 8,
    cor: '#2563eb', // Blue
    pin: '1001',
  },
  {
    id: 'col-2',
    nome: 'António Santos',
    funcao: 'Serralheiro Mecânico',
    contacto: '963 881 204',
    ativo: true,
    horasBaseDia: 8,
    cor: '#ea580c', // Orange
    pin: '1002',
  },
  {
    id: 'col-3',
    nome: 'Carlos Ferreira',
    funcao: 'Soldador Especializado MIG/TIG',
    contacto: '931 554 902',
    ativo: true,
    horasBaseDia: 8,
    cor: '#16a34a', // Green
    pin: '1003',
  },
  {
    id: 'col-4',
    nome: 'Ricardo Fernandes',
    funcao: 'Montador de Estruturas',
    contacto: '928 114 773',
    ativo: true,
    horasBaseDia: 8,
    cor: '#9333ea', // Purple
    pin: '1004',
  },
  {
    id: 'col-5',
    nome: 'Vítor Silva',
    funcao: 'Eletricista Industrial',
    contacto: '919 403 662',
    ativo: true,
    horasBaseDia: 8,
    cor: '#0891b2', // Cyan
    pin: '1005',
  },
  {
    id: 'col-6',
    nome: 'José Moreira',
    funcao: 'Operador de Grua / Manobrador',
    contacto: '965 229 118',
    ativo: true,
    horasBaseDia: 8,
    cor: '#ca8a04', // Amber
    pin: '1006',
  },
];

const SEED_OBRAS: Obra[] = [
  {
    id: 'obr-1',
    codigo: 'OBR-24-01',
    nome: 'Ampliação Pavilhão Maia',
    cliente: 'DST Group',
    localizacao: 'Zona Industrial da Maia',
    estado: 'em_curso',
    dataInicio: '2024-01-15',
    cor: '#2563eb',
  },
  {
    id: 'obr-2',
    codigo: 'OBR-24-03',
    nome: 'Estruturas Metálicas Hospital Central',
    cliente: 'Mota-Engil',
    localizacao: 'Porto Centro',
    estado: 'em_curso',
    dataInicio: '2024-02-01',
    cor: '#059669',
  },
  {
    id: 'obr-3',
    codigo: 'OBR-24-05',
    nome: 'Reabilitação Edifício Ribeira',
    cliente: 'Teixeira Duarte',
    localizacao: 'Vila Nova de Gaia',
    estado: 'em_curso',
    dataInicio: '2024-03-10',
    cor: '#d97706',
  },
  {
    id: 'obr-4',
    codigo: 'OBR-24-08',
    nome: 'Fábrica Sintra - Caleiras e Cobertura',
    cliente: 'MetaloEspo Projetos',
    localizacao: 'Sintra, Lisboa',
    estado: 'pausada',
    dataInicio: '2024-04-05',
    cor: '#64748b',
  },
];

// Limpeza imediata de todos os registos existentes solicitada pelo utilizador
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (!localStorage.getItem(STORAGE_KEYS.CLEANUP_FLAG)) {
      localStorage.removeItem('obratempo_registos_v1');
      localStorage.removeItem('obratempo_validacoes_v1');
      localStorage.setItem(STORAGE_KEYS.REGISTOS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify({}));
      localStorage.setItem(STORAGE_KEYS.CLEANUP_FLAG, 'true');
    }
  }
} catch (e) {
  console.warn('Storage cleanup notice:', e);
}

export const StorageService = {
  getColaboradores(): Colaborador[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COLABORADORES);
    if (!raw) {
      this.saveColaboradores(SEED_COLABORADORES);
      return SEED_COLABORADORES;
    }
    try {
      const parsed: Colaborador[] = JSON.parse(raw);
      // Assegurar que todos os colaboradores têm PIN definido
      let updated = false;
      const verified = parsed.map((c, idx) => {
        if (!c.pin || c.pin.trim() === '') {
          updated = true;
          return { ...c, pin: String(1001 + idx) };
        }
        return c;
      });
      if (updated) {
        this.saveColaboradores(verified);
      }
      return verified;
    } catch {
      return SEED_COLABORADORES;
    }
  },

  saveColaboradores(colaboradores: Colaborador[]): void {
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(colaboradores));
  },

  getCurrentWorkerId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_WORKER_ID) || null;
  },

  setCurrentWorkerId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_WORKER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKER_ID);
    }
  },

  getObras(): Obra[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OBRAS);
    if (!raw) {
      this.saveObras(SEED_OBRAS);
      return SEED_OBRAS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_OBRAS;
    }
  },

  saveObras(obras: Obra[]): void {
    localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
  },

  getRegistos(): RegistoHoras[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTOS);
    if (!raw) {
      this.saveRegistos([]);
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRegistos(registos: RegistoHoras[]): void {
    localStorage.setItem(STORAGE_KEYS.REGISTOS, JSON.stringify(registos));
  },

  clearAllRegistos(): void {
    localStorage.removeItem('obratempo_registos_v1');
    localStorage.removeItem('obratempo_validacoes_v1');
    localStorage.setItem(STORAGE_KEYS.REGISTOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify({}));
  },

  getSyncConfig(): GoogleSyncConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
    if (!raw) {
      const def: GoogleSyncConfig = {
        spreadsheetId: null,
        spreadsheetName: null,
        spreadsheetUrl: null,
        lastSyncTime: null,
        autoSync: true,
      };
      this.saveSyncConfig(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        spreadsheetId: null,
        spreadsheetName: null,
        spreadsheetUrl: null,
        lastSyncTime: null,
        autoSync: true,
      };
    }
  },

  saveSyncConfig(cfg: GoogleSyncConfig): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(cfg));
  },

  getValidacoes(): Record<string, ValidacaoDia> {
    const raw = localStorage.getItem(STORAGE_KEYS.VALIDACOES);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveValidacao(validacao: ValidacaoDia): void {
    const current = this.getValidacoes();
    current[validacao.data] = validacao;
    localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify(current));
  },

  saveAllValidacoes(validacoes: Record<string, ValidacaoDia>): void {
    localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify(validacoes));
  },

  removeValidacao(dateStr: string): void {
    const current = this.getValidacoes();
    delete current[dateStr];
    localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify(current));
  },

  getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  isAdminMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
  },

  setAdminMode(mode: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, mode ? 'true' : 'false');
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.COLABORADORES);
    localStorage.removeItem(STORAGE_KEYS.OBRAS);
    localStorage.setItem(STORAGE_KEYS.REGISTOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VALIDACOES, JSON.stringify({}));
  },
};
