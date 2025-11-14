/**
 * Party Tools
 *
 * Tools for accessing political party and parliamentary bloc information:
 * - List parties
 * - Get party details
 * - Get party senators
 * - List parliamentary blocs
 * - Get bloc details
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListPartiesSchema,
  PartyDetailsSchema,
  PartySenatorsSchema,
  ListBlocsSchema,
  BlocDetailsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

const PARTY_LIST_ENDPOINT = '/senador/partidos';
const SENATORS_LIST_ENDPOINT = '/senador/lista/atual';
const BLOC_LIST_ENDPOINT = '/composicao/lista/blocos';

type PartyRecord = Record<string, unknown>;
type SenatorRecord = Record<string, unknown>;
type BlocRecord = Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined;

function normalizeArray<T>(value: unknown): T[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  return [value as T];
}

function getNestedValue(source: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, source);
}

function extractParties(data: unknown): PartyRecord[] {
  const rootContainer = asRecord(data);
  const root = rootContainer ? rootContainer['ListaPartidos'] ?? data : data;
  const nested =
    getNestedValue(root, ['Partidos', 'Partido']) ??
    getNestedValue(root, ['Partidos']) ??
    getNestedValue(root, ['Partido']) ??
    root;
  return normalizeArray<PartyRecord>(nested);
}

function extractSenators(data: unknown): SenatorRecord[] {
  const rootContainer = asRecord(data);
  const root = rootContainer ? rootContainer['ListaParlamentarEmExercicio'] ?? data : data;
  const nested =
    getNestedValue(root, ['Parlamentares', 'Parlamentar']) ??
    getNestedValue(root, ['Parlamentares']) ??
    getNestedValue(root, ['Parlamentar']) ??
    root;
  return normalizeArray<SenatorRecord>(nested);
}

function extractBlocs(data: unknown): BlocRecord[] {
  const rootContainer = asRecord(data);
  const root = rootContainer ? rootContainer['ListaBlocoParlamentar'] ?? data : data;
  const nested =
    getNestedValue(root, ['Blocos', 'Bloco']) ??
    getNestedValue(root, ['Blocos']) ??
    getNestedValue(root, ['Bloco']) ??
    root;
  return normalizeArray<BlocRecord>(nested);
}

function paginateItems<T>(items: T[], pagina?: number, itens?: number): {
  pageItems: T[];
  total: number;
} {
  const total = items.length;
  const page = Math.max(pagina ?? 1, 1);
  const defaultPageSize = total > 0 ? total : 1;
  const pageSize = Math.max(itens ?? defaultPageSize, 1);
  const startIndex = (page - 1) * pageSize;
  return {
    pageItems: items.slice(startIndex, startIndex + pageSize),
    total,
  };
}

function findPartyByCode(parties: PartyRecord[], codigo: number): PartyRecord | undefined {
  return parties.find((party) => Number(asRecord(party)?.['Codigo']) === codigo);
}

function matchesLegislature(mandato: unknown, legislatura: number): boolean {
  const record = asRecord(mandato);
  if (!record) {
    return false;
  }

  const primeira = asRecord(record['PrimeiraLegislaturaDoMandato']);
  const segunda = asRecord(record['SegundaLegislaturaDoMandato']);

  const toNumber = (value: Record<string, unknown> | undefined) =>
    value ? Number(value['NumeroLegislatura']) : NaN;

  return toNumber(primeira) === legislatura || toNumber(segunda) === legislatura;
}

function blocMatchesLegislatura(bloc: BlocRecord, legislatura: number): boolean {
  const legislaturas =
    getNestedValue(bloc, ['Legislaturas', 'Legislatura']) ??
    getNestedValue(bloc, ['Legislaturas']) ??
    getNestedValue(bloc, ['Legislatura']);

  if (!legislaturas) {
    return true;
  }

  return normalizeArray<Record<string, unknown>>(legislaturas).some(
    (entry) => Number(entry?.['NumeroLegislatura']) === legislatura
  );
}

// ============================================================================
// List Parties Tool
// ============================================================================

/**
 * List all political parties
 */
async function listPartiesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListPartiesSchema,
    args,
    'partidos_listar'
  );

  context.logger.debug('Listing parties', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      PARTY_LIST_ENDPOINT,
      {}
    );

    const parties = extractParties(response.data);
    const { pageItems, total } = paginateItems(
      parties,
      params.pagina,
      params.itens
    );

    const text = JSON.stringify(pageItems, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Partidos Políticos do Senado Federal (${pageItems.length} de ${total}):\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list parties', error as Error);
    throw error;
  }
}

export const listPartiesTool: ToolDefinition = {
  name: 'partidos_listar',
  description:
    'Lista todos os partidos políticos com representação no Senado Federal. Retorna informações básicas como sigla, nome completo, e número de senadores filiados.',
  inputSchema: zodToJsonSchema(ListPartiesSchema),
  handler: listPartiesHandler,
  category: 'party',
};

// ============================================================================
// Party Details Tool
// ============================================================================

/**
 * Get detailed information about a specific party
 */
async function partyDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    PartyDetailsSchema,
    args,
    'partido_detalhes'
  );

  context.logger.debug('Getting party details', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      PARTY_LIST_ENDPOINT,
      {}
    );

    const parties = extractParties(response.data);
    const party = findPartyByCode(parties, params.codigo);

    if (!party) {
      throw new Error(`Partido com código ${params.codigo} não encontrado`);
    }

    const text = JSON.stringify(party, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes do Partido:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get party details', error as Error);
    throw error;
  }
}

export const partyDetailsTool: ToolDefinition = {
  name: 'partido_detalhes',
  description:
    'Obtém informações detalhadas sobre um partido político específico. Inclui sigla, nome completo, número de registro, data de fundação, número de senadores filiados, líderes, e bloco parlamentar ao qual pertence.',
  inputSchema: zodToJsonSchema(PartyDetailsSchema),
  handler: partyDetailsHandler,
  category: 'party',
};

// ============================================================================
// Party Senators Tool
// ============================================================================

/**
 * Get all senators affiliated with a specific party
 */
async function partySenatorsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    PartySenatorsSchema,
    args,
    'partido_senadores'
  );

  context.logger.debug('Getting party senators', { params });

  try {
    const partyResponse = await context.httpClient.get<unknown>(
      PARTY_LIST_ENDPOINT,
      {}
    );

    const parties = extractParties(partyResponse.data);
    const party = findPartyByCode(parties, params.codigo);

    if (!party) {
      throw new Error(`Partido com código ${params.codigo} não encontrado`);
    }

    const partySigla = String(asRecord(party)?.['Sigla'] || '').toUpperCase();

    if (!partySigla) {
      throw new Error('Partido sem sigla associada na base de dados');
    }

    const senatorsResponse = await context.httpClient.get<unknown>(
      SENATORS_LIST_ENDPOINT,
      {}
    );

    const senators = extractSenators(senatorsResponse.data);

    const filtered = senators.filter((senator) => {
      const identificacao = asRecord(asRecord(senator)?.['IdentificacaoParlamentar']);
      const sigla = String(identificacao?.['SiglaPartidoParlamentar'] || '').toUpperCase();
      return sigla === partySigla;
    });

    const finalList = params.legislatura
      ? filtered.filter((senator) =>
          matchesLegislature(
            asRecord(senator)?.['Mandato'],
            params.legislatura!
          )
        )
      : filtered;

    const text = JSON.stringify(finalList, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Senadores do Partido:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get party senators', error as Error);
    throw error;
  }
}

export const partySenatorsTool: ToolDefinition = {
  name: 'partido_senadores',
  description:
    'Lista todos os senadores filiados a um partido político específico. Mostra nome, UF, situação (em exercício, licenciado, etc.) e mandato. Permite filtrar por legislatura.',
  inputSchema: zodToJsonSchema(PartySenatorsSchema),
  handler: partySenatorsHandler,
  category: 'party',
};

// ============================================================================
// List Parliamentary Blocs Tool
// ============================================================================

/**
 * List all parliamentary blocs
 */
async function listBlocsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListBlocsSchema,
    args,
    'blocos_listar'
  );

  context.logger.debug('Listing parliamentary blocs', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      BLOC_LIST_ENDPOINT,
      {}
    );

    const blocs = extractBlocs(response.data);
    const filtered = params.legislatura
      ? blocs.filter((bloc) =>
          blocMatchesLegislatura(bloc, params.legislatura!)
        )
      : blocs;

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
          text: `Blocos Parlamentares do Senado Federal (${pageItems.length} de ${total}):\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list parliamentary blocs', error as Error);
    throw error;
  }
}

export const listBlocsTool: ToolDefinition = {
  name: 'blocos_listar',
  description:
    'Lista todos os blocos parlamentares no Senado Federal. Blocos são agrupamentos de partidos políticos para atuação coordenada. Retorna informações sobre cada bloco e os partidos que o compõem. Permite filtrar por legislatura.',
  inputSchema: zodToJsonSchema(ListBlocsSchema),
  handler: listBlocsHandler,
  category: 'party',
};

// ============================================================================
// Bloc Details Tool
// ============================================================================

/**
 * Get detailed information about a specific parliamentary bloc
 */
async function blocDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    BlocDetailsSchema,
    args,
    'bloco_detalhes'
  );

  context.logger.debug('Getting bloc details', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/composicao/bloco/${params.codigo}`,
      {}
    );

    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes do Bloco Parlamentar:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get bloc details', error as Error);
    throw error;
  }
}

export const blocDetailsTool: ToolDefinition = {
  name: 'bloco_detalhes',
  description:
    'Obtém informações detalhadas sobre um bloco parlamentar específico. Inclui nome, sigla, partidos que o compõem, número de senadores, líderes, data de criação, e outras informações relevantes.',
  inputSchema: zodToJsonSchema(BlocDetailsSchema),
  handler: blocDetailsHandler,
  category: 'party',
};

// ============================================================================
// Export all party tools
// ============================================================================

export const partyTools: ToolDefinition[] = [
  listPartiesTool,
  partyDetailsTool,
  partySenatorsTool,
  listBlocsTool,
  blocDetailsTool,
];
