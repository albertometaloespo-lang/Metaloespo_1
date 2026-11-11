import { Colaborador, Obra, RegistoHoras, GoogleDriveSpreadsheet, ValidacaoDia } from '../types';
import { getAccessToken } from './googleAuth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const GoogleSheetsService = {
  /**
   * Lista ficheiros de folha de cálculo no Google Drive
   */
  async listSpreadsheets(): Promise<GoogleDriveSpreadsheet[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('Não autenticado com o Google');

    const q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
    const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=30`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao listar ficheiros: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Cria uma nova Folha de Cálculo no Google Drive para o registo de obras
   */
  async createTimesheetSpreadsheet(title: string = 'Metaloespo - Base de Dados Central'): Promise<{
    id: string;
    name: string;
    url: string;
  }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Não autenticado com o Google');

    const body = {
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Registos_Horas',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Colaboradores',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Obras',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Validacoes_Dias',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    };

    const res = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Falha ao criar folha de cálculo');
    }

    const created = await res.json();
    const spreadsheetId = created.spreadsheetId;

    // Inicializar os cabeçalhos das folhas
    await this.setupHeaders(spreadsheetId, token);

    return {
      id: spreadsheetId,
      name: title,
      url: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  },

  /**
   * Prepara os cabeçalhos formatados na folha criada
   */
  async setupHeaders(spreadsheetId: string, token: string): Promise<void> {
    const headersData = [
      {
        range: 'Registos_Horas!A1:L1',
        values: [
          [
            'Data',
            'Colaborador',
            'Função',
            'Código Obra',
            'Nome Obra',
            'Cliente',
            'Horas Normais',
            'Horas Extra',
            'Total Horas',
            'Tarefa / Descrição',
            'Validado Admin',
            'ID Registo',
          ],
        ],
      },
      {
        range: 'Colaboradores!A1:G1',
        values: [['ID', 'Nome', 'Função', 'Contacto', 'Ativo', 'Horas Base Dia', 'PIN']],
      },
      {
        range: 'Obras!A1:E1',
        values: [['Código', 'Nome da Obra', 'Cliente', 'Localização', 'Estado']],
      },
      {
        range: 'Validacoes_Dias!A1:D1',
        values: [['Data', 'Bloqueado', 'Validado Por', 'Validado Em']],
      },
    ];

    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headersData,
      }),
    });
  },

  /**
   * Sincroniza todos os dados da app para a Folha de Cálculo no Google Drive
   */
  async syncAllToSpreadsheet(
    spreadsheetId: string,
    colaboradores: Colaborador[],
    obras: Obra[],
    registos: RegistoHoras[],
    validacoes?: Record<string, ValidacaoDia>
  ): Promise<{ rowsCount: number }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Não autenticado com o Google');

    // Mapear registos com nomes dos colaboradores e obras
    const colMap = new Map(colaboradores.map((c) => [c.id, c]));
    const obrMap = new Map(obras.map((o) => [o.id, o]));

    // Ordenar registos por data descendente
    const sorted = [...registos].sort((a, b) => b.data.localeCompare(a.data));

    const registosRows = sorted.map((r) => {
      const col = colMap.get(r.colaboradorId);
      const obr = obrMap.get(r.obraId);
      const total = Number((r.horasNormais + r.horasExtra).toFixed(2));
      return [
        r.data,
        col?.nome || 'Desconhecido',
        col?.funcao || '',
        obr?.codigo || '',
        obr?.nome || 'Obra Removida',
        obr?.cliente || '',
        r.horasNormais,
        r.horasExtra,
        total,
        r.descricao || '',
        r.validado || r.bloqueado ? 'Sim (Bloqueado)' : 'Em Aberto',
        r.id,
      ];
    });

    const colaboradoresRows = colaboradores.map((c) => [
      c.id,
      c.nome,
      c.funcao,
      c.contacto || '',
      c.ativo ? 'Sim' : 'Não',
      c.horasBaseDia,
      c.pin || '',
    ]);

    const obrasRows = obras.map((o) => [
      o.codigo,
      o.nome,
      o.cliente,
      o.localizacao,
      o.estado === 'em_curso' ? 'Em Curso' : o.estado === 'concluida' ? 'Concluída' : 'Pausada',
    ]);

    const validacoesRows = Object.values(validacoes || {}).map((v) => [
      v.data,
      v.bloqueado ? 'Sim' : 'Não',
      v.validadoPor || '',
      v.validadoEm || '',
    ]);

    // Primeiro limpamos as linhas de dados (mantendo o cabeçalho)
    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/Registos_Horas!A2:L10000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/Validacoes_Dias!A2:D1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    // Enviar dados completos
    const batchData = [
      {
        range: 'Registos_Horas!A1:L1',
        values: [
          [
            'Data',
            'Colaborador',
            'Função',
            'Código Obra',
            'Nome Obra',
            'Cliente',
            'Horas Normais',
            'Horas Extra',
            'Total Horas',
            'Tarefa / Descrição',
            'Validado Admin',
            'ID Registo',
          ],
        ],
      },
      ...(registosRows.length > 0
        ? [
            {
              range: `Registos_Horas!A2:L${registosRows.length + 1}`,
              values: registosRows,
            },
          ]
        : []),
      {
        range: 'Colaboradores!A1:G1',
        values: [['ID', 'Nome', 'Função', 'Contacto', 'Ativo', 'Horas Base Dia', 'PIN']],
      },
      ...(colaboradoresRows.length > 0
        ? [
            {
              range: `Colaboradores!A2:G${colaboradoresRows.length + 1}`,
              values: colaboradoresRows,
            },
          ]
        : []),
      {
        range: 'Obras!A1:E1',
        values: [['Código', 'Nome da Obra', 'Cliente', 'Localização', 'Estado']],
      },
      ...(obrasRows.length > 0
        ? [
            {
              range: `Obras!A2:E${obrasRows.length + 1}`,
              values: obrasRows,
            },
          ]
        : []),
      {
        range: 'Validacoes_Dias!A1:D1',
        values: [['Data', 'Bloqueado', 'Validado Por', 'Validado Em']],
      },
      ...(validacoesRows.length > 0
        ? [
            {
              range: `Validacoes_Dias!A2:D${validacoesRows.length + 1}`,
              values: validacoesRows,
            },
          ]
        : []),
    ];

    const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Falha ao sincronizar dados na folha');
    }

    return { rowsCount: registosRows.length };
  },

  /**
   * Lê todos os dados existentes da Folha de Cálculo no Google Drive
   */
  async readSpreadsheetData(spreadsheetId: string): Promise<{
    colaboradores: Colaborador[];
    obras: Obra[];
    registos: RegistoHoras[];
    validacoes: Record<string, ValidacaoDia>;
  }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Não autenticado com o Google');

    const ranges = ['Registos_Horas!A2:L', 'Colaboradores!A2:G', 'Obras!A2:E', 'Validacoes_Dias!A2:D'];
    const url = `${SHEETS_API_URL}/${spreadsheetId}/values:batchGet?${ranges
      .map((r) => `ranges=${encodeURIComponent(r)}`)
      .join('&')}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Falha ao ler dados da folha de cálculo');
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    const registosRows: any[][] = valueRanges[0]?.values || [];
    const colaboradoresRows: any[][] = valueRanges[1]?.values || [];
    const obrasRows: any[][] = valueRanges[2]?.values || [];
    const validacoesRows: any[][] = valueRanges[3]?.values || [];

    // 1. Processar Colaboradores
    const parsedCols: Colaborador[] = colaboradoresRows.map((row, idx) => ({
      id: row[0] || `col-remote-${idx + 1}`,
      nome: row[1] || `Colaborador ${idx + 1}`,
      funcao: row[2] || 'Colaborador',
      contacto: row[3] || '',
      ativo: row[4] !== 'Não',
      horasBaseDia: Number(row[5]) || 8,
      cor: '#2563eb',
      pin: row[6] ? String(row[6]) : String(1001 + idx),
    }));

    // 2. Processar Obras
    const parsedObras: Obra[] = obrasRows.map((row, idx) => ({
      id: `obr-remote-${row[0] || idx + 1}`,
      codigo: row[0] || `OBR-${idx + 1}`,
      nome: row[1] || `Obra ${idx + 1}`,
      cliente: row[2] || '',
      localizacao: row[3] || '',
      estado:
        row[4]?.toLowerCase().includes('conclu')
          ? 'concluida'
          : row[4]?.toLowerCase().includes('paus')
          ? 'pausada'
          : 'em_curso',
      dataInicio: new Date().toISOString().split('T')[0],
      cor: '#059669',
    }));

    // 3. Processar Registos de Horas
    const parsedRegistos: RegistoHoras[] = registosRows
      .filter((row) => row && row[0]) // garantir que tem data válida
      .map((row, idx) => {
        const rowData = String(row[0]).trim();
        const colNome = String(row[1] || '').trim();
        const obrCodigo = String(row[3] || '').trim();
        const obrNome = String(row[4] || '').trim();
        const idReg = row[11] || `reg-${rowData}-${colNome}-${obrCodigo}-${idx}`;

        const matchingCol = parsedCols.find((c) => c.nome.toLowerCase() === colNome.toLowerCase());
        const matchingObra = parsedObras.find(
          (o) =>
            (obrCodigo && o.codigo.toLowerCase() === obrCodigo.toLowerCase()) ||
            (obrNome && o.nome.toLowerCase() === obrNome.toLowerCase())
        );

        const horasNorm = parseFloat(String(row[6]).replace(',', '.')) || 0;
        const horasExt = parseFloat(String(row[7]).replace(',', '.')) || 0;
        const isValidado =
          String(row[10] || '').toLowerCase().includes('sim') ||
          String(row[10] || '').toLowerCase().includes('bloqueado');

        return {
          id: idReg,
          data: rowData,
          colaboradorId: matchingCol?.id || row[11] || `col-${idx}`,
          obraId: matchingObra?.id || `obr-${idx}`,
          horasNormais: horasNorm,
          horasExtra: horasExt,
          descricao: row[9] || '',
          validado: isValidado,
          bloqueado: isValidado,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };
      });

    // 4. Processar Validações do Dia
    const parsedValidacoes: Record<string, ValidacaoDia> = {};
    validacoesRows.forEach((row) => {
      if (row && row[0]) {
        const d = String(row[0]).trim();
        parsedValidacoes[d] = {
          data: d,
          bloqueado: String(row[1] || '').toLowerCase().includes('sim'),
          validadoPor: row[2] || 'Admin',
          validadoEm: row[3] || '',
        };
      }
    });

    return {
      colaboradores: parsedCols,
      obras: parsedObras,
      registos: parsedRegistos,
      validacoes: parsedValidacoes,
    };
  },

  /**
   * Sincronização Bidirecional Completa para Todas as Aplicações:
   * 1. Descarrega registos de outros telemóveis e computadores da Folha Central
   * 2. Une de forma inteligente com os registos locais deste dispositivo
   * 3. Atualiza a folha central do Google Drive
   * 4. Garante que todos os dispositivos têm exatamente os mesmos dados
   */
  async syncBidirectional(
    spreadsheetId: string,
    localCols: Colaborador[],
    localObras: Obra[],
    localRegistos: RegistoHoras[],
    localValidacoes: Record<string, ValidacaoDia> = {}
  ): Promise<{
    colaboradores: Colaborador[];
    obras: Obra[];
    registos: RegistoHoras[];
    validacoes: Record<string, ValidacaoDia>;
    syncedCount: number;
  }> {
    // 1. Ler dados remotos
    const remote = await this.readSpreadsheetData(spreadsheetId).catch((err) => {
      console.warn('Aviso ao ler dados remotos para sincronizar:', err);
      return { colaboradores: [], obras: [], registos: [], validacoes: {} };
    });

    // 2. Fundir Colaboradores (preservando cores e metadados locais)
    const colMap = new Map<string, Colaborador>();
    remote.colaboradores.forEach((c) => colMap.set(c.nome.toLowerCase(), c));
    localCols.forEach((c) => colMap.set(c.nome.toLowerCase(), c));
    const mergedCols = Array.from(colMap.values());

    // 3. Fundir Obras
    const obrMap = new Map<string, Obra>();
    remote.obras.forEach((o) => obrMap.set(o.codigo.toLowerCase(), o));
    localObras.forEach((o) => obrMap.set(o.codigo.toLowerCase(), o));
    const mergedObras = Array.from(obrMap.values());

    // 4. Fundir Registos de Horas
    const registosMap = new Map<string, RegistoHoras>();

    // Adicionar remotos primeiro
    remote.registos.forEach((r) => {
      const key = `${r.data}_${r.colaboradorId}_${r.obraId}`;
      registosMap.set(key, r);
    });

    // Adicionar locais (sobrepõem caso existam)
    localRegistos.forEach((r) => {
      const key = `${r.data}_${r.colaboradorId}_${r.obraId}`;
      registosMap.set(key, r);
    });

    const mergedRegistos = Array.from(registosMap.values()).sort((a, b) =>
      b.data.localeCompare(a.data)
    );

    // 5. Fundir Validações de Dias
    const mergedValidacoes: Record<string, ValidacaoDia> = {
      ...(remote.validacoes || {}),
      ...(localValidacoes || {}),
    };

    // 6. Enviar a base consolidada para a Folha do Google Drive
    await this.syncAllToSpreadsheet(
      spreadsheetId,
      mergedCols,
      mergedObras,
      mergedRegistos,
      mergedValidacoes
    );

    return {
      colaboradores: mergedCols,
      obras: mergedObras,
      registos: mergedRegistos,
      validacoes: mergedValidacoes,
      syncedCount: mergedRegistos.length,
    };
  },

  /**
   * Garante que existe uma Base de Dados Central ligada no Google Drive.
   * Se já existir na conta do Google Drive com nome "Metaloespo - Base de Dados Central", liga-a.
   * Caso contrário cria automaticamente a folha formatada e inicializada com os dados.
   */
  async ensureCentralSpreadsheet(
    colaboradores: Colaborador[],
    obras: Obra[],
    registos: RegistoHoras[],
    validacoes: Record<string, ValidacaoDia> = {}
  ): Promise<{ id: string; name: string; url: string; isNew: boolean }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Não autenticado com o Google');

    const files = await this.listSpreadsheets().catch(() => []);
    const existing = files.find(
      (f) =>
        f.name === 'Metaloespo - Base de Dados Central' ||
        f.name === 'Metaloespo - Registo de Horas' ||
        f.name.toLowerCase().includes('metaloespo') ||
        f.name.toLowerCase().includes('obratempo')
    );

    if (existing) {
      // Ler dados e fundir
      const synced = await this.syncBidirectional(
        existing.id,
        colaboradores,
        obras,
        registos,
        validacoes
      );
      return {
        id: existing.id,
        name: existing.name,
        url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}`,
        isNew: false,
      };
    }

    const created = await this.createTimesheetSpreadsheet('Metaloespo - Base de Dados Central');
    await this.syncAllToSpreadsheet(created.id, colaboradores, obras, registos, validacoes);
    return {
      ...created,
      isNew: true,
    };
  },



  /**
   * Adiciona ou atualiza registos de um dia específico na Folha do Google Drive
   */
  async appendRegistoRow(
    spreadsheetId: string,
    registo: RegistoHoras,
    colaborador?: Colaborador,
    obra?: Obra
  ): Promise<void> {
    const token = await getAccessToken();
    if (!token) return;

    const row = [
      registo.data,
      colaborador?.nome || '',
      colaborador?.funcao || '',
      obra?.codigo || '',
      obra?.nome || '',
      obra?.cliente || '',
      registo.horasNormais,
      registo.horasExtra,
      registo.horasNormais + registo.horasExtra,
      registo.descricao || '',
      registo.id,
    ];

    await fetch(
      `${SHEETS_API_URL}/${spreadsheetId}/values/Registos_Horas!A:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );
  },
};
