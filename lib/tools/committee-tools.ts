/**
 * Committee Tools
 *
 * Tools for accessing committee information:
 * - List committees
 * - Get committee details
 * - Get committee members
 * - Get committee meetings
 * - Get committee proposals
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListCommitteesSchema,
  CommitteeDetailsSchema,
  CommitteeMembersSchema,
  CommitteeMeetingsSchema,
  CommitteeProposalsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

const COMMITTEE_LIST_BASE_ENDPOINT = '/composicao/lista';
const COMMITTEE_TYPES = ['permanente', 'temporaria', 'cpi', 'cpmi', 'orgaos'] as const;
const COMMITTEE_COMPOSITION_ENDPOINT = '/composicao/comissao';
const COMMITTEE_AGENDA_ENDPOINT = '/comissao/agenda';
const COMMITTEE_PROPOSALS_ENDPOINT = '/materia/lista/comissao';

type CommitteeRecord = Record<string, unknown>;
type MeetingRecord = Record<string, unknown>;
type ProposalRecord = Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const getNestedValue = (source: unknown, path: string[]): unknown =>
  path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, source);

const normalizeArray = <T>(value: unknown): T[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  return [value as T];
};

function extractCommittees(data: unknown): CommitteeRecord[] {
  let root: unknown = data;

  const wrappers = [
    'ListaColegiados',
    'ComissoesPermanentes',
    'ComissoesTemporarias',
    'ComissoesCPI',
    'ComissoesCPMI',
    'OrgaosColegiados',
  ];

  for (const key of wrappers) {
    const container = asRecord(root);
    if (container && container[key]) {
      root = container[key];
      break;
    }
  }

  const nested =
    getNestedValue(root, ['Colegiados', 'Colegiado']) ??
    getNestedValue(root, ['Colegiados']) ??
    getNestedValue(root, ['Colegiado']) ??
    root;

  return normalizeArray<CommitteeRecord>(nested);
}

const paginateItems = <T>(items: T[], pagina?: number, itens?: number) => {
  const total = items.length;
  const page = Math.max(pagina ?? 1, 1);
  const defaultPageSize = total > 0 ? total : 1;
  const pageSize = Math.max(itens ?? defaultPageSize, 1);
  const startIndex = (page - 1) * pageSize;

  return {
    pageItems: items.slice(startIndex, startIndex + pageSize),
    total,
  };
};

const matchesFilter = (value: unknown, filter?: string): boolean => {
  if (!filter) {
    return true;
  }

  const normalized = String(value || '').toLowerCase();
  return normalized.includes(filter.toLowerCase());
};

const sanitizeCommitteeSigla = (committee: CommitteeRecord | undefined): string | undefined => {
  const record = asRecord(committee);
  if (!record) {
    return undefined;
  }

  const sigla = record['Sigla'] ?? record['SiglaComissao'] ?? record['SiglaColegiado'] ?? record['sigla'];
  return sigla ? String(sigla).toUpperCase() : undefined;
};

const findCommitteeByCode = (committees: CommitteeRecord[], codigo: number): CommitteeRecord | undefined =>
  committees.find((committee) => {
    const record = asRecord(committee);
    if (!record) {
      return false;
    }

    const value =
      record['Codigo'] ??
      record['CodigoColegiado'] ??
      record['CodigoComissao'] ??
      record['codigo'];

    return Number(value) === codigo;
  });

const toAgendaDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10).replace(/-/g, '');
  }

  return value.replace(/-/g, '').slice(0, 8);
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    start: toAgendaDate(start),
    end: toAgendaDate(end),
  };
};

async function fetchAllCommittees(context: ToolContext): Promise<CommitteeRecord[]> {
  const results = await Promise.all(
    COMMITTEE_TYPES.map(async (type) => {
      const response = await context.httpClient.get<unknown>(
        `${COMMITTEE_LIST_BASE_ENDPOINT}/${type}`,
        {}
      );

      return extractCommittees(response.data);
    })
  );

  return results.flat();
}

async function fetchCommitteeMetadata(
  context: ToolContext,
  codigo: number
): Promise<{ committee?: CommitteeRecord; committees: CommitteeRecord[] }> {
  const committees = await fetchAllCommittees(context);
  const committee = findCommitteeByCode(committees, codigo);
  return { committee, committees };
}

// ============================================================================
// List Committees Tool
// ============================================================================

/**
 * List all committees with optional filters
 */
async function listCommitteesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListCommitteesSchema,
    args,
    'comissoes_listar'
  );

  context.logger.debug('Listing committees', { params });

  try {
    const committees = await fetchAllCommittees(context);

    const filtered = committees.filter((committee) => {
      const record = asRecord(committee);
      if (!record) {
        return false;
      }

      const matchesSigla = matchesFilter(
        record['Sigla'] ?? record['SiglaColegiado'] ?? record['sigla'],
        params.sigla
      );
      const matchesTipo = params.tipo
        ? matchesFilter(record['SiglaTipoColegiado'] ?? record['siglaTipoColegiado'], params.tipo) ||
          matchesFilter(record['DescricaoTipoColegiado'] ?? record['descricaoTipoColegiado'] ?? record['NomeTipoColegiado'], params.tipo)
        : true;

      return matchesSigla && matchesTipo;
    });

    const { pageItems, total } = paginateItems(
      filtered,
      params.pagina,
      params.itens
    );

    const text = JSON.stringify(pageItems, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Comissões do Senado Federal (${pageItems.length} de ${total}):\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list committees', error as Error);
    throw error;
  }
}

export const listCommitteesTool: ToolDefinition = {
  name: 'comissoes_listar',
  description:
    'Lista todas as comissões do Senado Federal. Permite filtrar por tipo (permanente, temporária, mista, parlamentar de inquérito, etc.) e sigla. Retorna informações básicas sobre cada comissão.',
  inputSchema: zodToJsonSchema(ListCommitteesSchema),
  handler: listCommitteesHandler,
  category: 'committee',
};

// ============================================================================
// Committee Details Tool
// ============================================================================

/**
 * Get detailed information about a specific committee
 */
async function committeeDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    CommitteeDetailsSchema,
    args,
    'comissao_detalhes'
  );

  context.logger.debug('Getting committee details', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `${COMMITTEE_COMPOSITION_ENDPOINT}/${params.codigo}`,
      {}
    );

    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes da Comissão:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get committee details', error as Error);
    throw error;
  }
}

export const committeeDetailsTool: ToolDefinition = {
  name: 'comissao_detalhes',
  description:
    'Obtém informações detalhadas sobre uma comissão específica. Inclui nome completo, sigla, tipo, finalidade, competências, composição atual, telefones, e-mails, endereços e outras informações relevantes.',
  inputSchema: zodToJsonSchema(CommitteeDetailsSchema),
  handler: committeeDetailsHandler,
  category: 'committee',
};

// ============================================================================
// Committee Members Tool
// ============================================================================

/**
 * Get members of a specific committee
 */
async function committeeMembersHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    CommitteeMembersSchema,
    args,
    'comissao_membros'
  );

  context.logger.debug('Getting committee members', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `${COMMITTEE_COMPOSITION_ENDPOINT}/${params.codigo}`,
      {}
    );

    const members =
      getNestedValue(response.data, ['ComposicaoComissao', 'Membros', 'Membro']) ??
      getNestedValue(response.data, ['Membros', 'Membro']) ??
      getNestedValue(response.data, ['Membros']) ??
      response.data;

    const text = JSON.stringify(normalizeArray(members), null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Membros da Comissão:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get committee members', error as Error);
    throw error;
  }
}

export const committeeMembersTool: ToolDefinition = {
  name: 'comissao_membros',
  description:
    'Lista todos os membros de uma comissão específica. Mostra senadores que compõem a comissão, seus cargos (presidente, vice-presidente, titular, suplente) e partidos. Permite filtrar por legislatura.',
  inputSchema: zodToJsonSchema(CommitteeMembersSchema),
  handler: committeeMembersHandler,
  category: 'committee',
};

// ============================================================================
// Committee Meetings Tool
// ============================================================================

/**
 * Get meetings/sessions of a specific committee
 */
async function committeeMeetingsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    CommitteeMeetingsSchema,
    args,
    'comissao_reunioes'
  );

  context.logger.debug('Getting committee meetings', { params });

  try {
    const defaultRange = getDefaultDateRange();
    const startDate = params.dataInicio
      ? toAgendaDate(params.dataInicio)
      : defaultRange.start;
    const endDate = params.dataFim
      ? toAgendaDate(params.dataFim)
      : defaultRange.end;

    const path = startDate === endDate
      ? `${COMMITTEE_AGENDA_ENDPOINT}/${startDate}`
      : `${COMMITTEE_AGENDA_ENDPOINT}/${startDate}/${endDate}`;

    const response = await context.httpClient.get<unknown>(
      path,
      {}
    );

    const meetings =
      getNestedValue(response.data, ['AgendaReuniao', 'reunioes', 'reuniao']) ??
      getNestedValue(response.data, ['reunioes', 'reuniao']) ??
      getNestedValue(response.data, ['reunioes']) ??
      response.data;

    const meetingList = normalizeArray<MeetingRecord>(meetings).filter((meeting) => {
      const participants = normalizeArray<Record<string, unknown>>(
        getNestedValue(meeting, ['colegiados'])
      );

      return participants.some(
        (entry) => Number(asRecord(entry)?.['codigo']) === params.codigo
      );
    });

    const text = JSON.stringify(meetingList, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Reuniões da Comissão:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get committee meetings', error as Error);
    throw error;
  }
}

export const committeeMeetingsTool: ToolDefinition = {
  name: 'comissao_reunioes',
  description:
    'Lista todas as reuniões realizadas por uma comissão específica. Inclui data, hora, tipo de reunião (ordinária, extraordinária, audiência pública, etc.), pauta, e resultados. Permite filtrar por período.',
  inputSchema: zodToJsonSchema(CommitteeMeetingsSchema),
  handler: committeeMeetingsHandler,
  category: 'committee',
};

// ============================================================================
// Committee Proposals Tool
// ============================================================================

/**
 * Get proposals under analysis by a specific committee
 */
async function committeeProposalsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    CommitteeProposalsSchema,
    args,
    'comissao_materias'
  );

  context.logger.debug('Getting committee proposals', { params });

  try {
    const { committee } = await fetchCommitteeMetadata(context, params.codigo);

    if (!committee) {
      throw new Error(`Comissão com código ${params.codigo} não encontrada`);
    }

    const sigla = sanitizeCommitteeSigla(committee);
    const query: Record<string, unknown> = {
      codigo: params.codigo,
    };

    if (sigla) {
      query['sigla'] = sigla;
    }

    if (params.pagina) {
      query['pagina'] = params.pagina;
    }

    if (params.itens) {
      query['itens'] = params.itens;
    }

    const response = await context.httpClient.get<unknown>(
      COMMITTEE_PROPOSALS_ENDPOINT,
      query
    );

    const proposals =
      getNestedValue(response.data, ['ListaMateriasEmComissao', 'Materias', 'Materia']) ??
      getNestedValue(response.data, ['Materias', 'Materia']) ??
      getNestedValue(response.data, ['Materia']) ??
      response.data;

    const normalized = normalizeArray<ProposalRecord>(proposals);
    const { pageItems, total } = paginateItems(
      normalized,
      params.pagina,
      params.itens
    );

    const text = JSON.stringify(pageItems, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Matérias em Análise na Comissão (${pageItems.length} de ${total}):\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get committee proposals', error as Error);
    throw error;
  }
}

export const committeeProposalsTool: ToolDefinition = {
  name: 'comissao_materias',
  description:
    'Lista todas as matérias legislativas que estão ou estiveram sob análise de uma comissão específica. Mostra o status de tramitação, relator designado, e parecer emitido (se houver).',
  inputSchema: zodToJsonSchema(CommitteeProposalsSchema),
  handler: committeeProposalsHandler,
  category: 'committee',
};

// ============================================================================
// Export all committee tools
// ============================================================================

export const committeeTools: ToolDefinition[] = [
  listCommitteesTool,
  committeeDetailsTool,
  committeeMembersTool,
  committeeMeetingsTool,
  committeeProposalsTool,
];
