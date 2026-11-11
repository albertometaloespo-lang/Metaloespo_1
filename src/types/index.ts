/**
 * Definições de Tipos para a Aplicação ObraTempo
 */

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  contacto?: string;
  ativo: boolean;
  horasBaseDia: number; // habitualmente 8h
  cor: string; // Hex color para avatar
  pin: string; // PIN pessoal de 4 dígitos para acesso exclusivo do colaborador
  email?: string;
}

export interface Obra {
  id: string;
  codigo: string; // Ex: OBR-24-01
  nome: string;
  cliente: string;
  localizacao: string;
  estado: 'em_curso' | 'pausada' | 'concluida';
  dataInicio: string;
  cor: string;
}

export interface RegistoHoras {
  id: string;
  data: string; // Formato YYYY-MM-DD
  colaboradorId: string;
  obraId: string;
  horasNormais: number; // Ex: 4.5
  horasExtra: number; // Ex: 1.0
  descricao?: string; // Ex: "Montagem de vigas HEB 300"
  validado?: boolean; // Validado pelo administrador
  bloqueado?: boolean; // Bloqueado contra alterações
  validadoPor?: string;
  validadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ValidacaoDia {
  data: string; // Formato YYYY-MM-DD
  bloqueado: boolean;
  validadoPor: string;
  validadoEm: string;
  notasAdmin?: string;
}

// Representação de registo formatada para tabela / Google Sheets
export interface LinhaPlanilhaHoras {
  id: string;
  data: string;
  colaboradorNome: string;
  colaboradorFuncao: string;
  obraCodigo: string;
  obraNome: string;
  cliente: string;
  horasNormais: number;
  horasExtra: number;
  totalHoras: number;
  descricao: string;
}

export interface GoogleDriveSpreadsheet {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleSyncConfig {
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  autoSync: boolean;
}

export type ViewTab = 'registo' | 'obras' | 'equipa' | 'relatorios' | 'drive';

export type UserRole = 'colaborador' | 'administrador';
