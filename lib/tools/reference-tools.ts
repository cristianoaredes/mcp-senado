/**
 * Reference Data Tools
 *
 * Tools for accessing reference data and classifications:
 * - Legislatures
 * - Proposal types
 * - Proposal statuses
 * - Committee types
 * - Brazilian states
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListLegislaturesSchema,
  ListProposalTypesSchema,
  ListProposalStatusesSchema,
  ListCommitteeTypesSchema,
  ListStatesSchema,
  ListAuthorTypesSchema,
  ListSessionTypesSchema,
  ListVotingTypesSchema,
  ListDocumentTypesSchema,
  ListSubjectsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

const IBGE_STATES_ENDPOINT =
  'https://servicodados.ibge.gov.br/api/v1/localidades/estados';

type IBGEState = {
  id: number;
  sigla: string;
  nome: string;
  regiao?: {
    id: number;
    sigla: string;
    nome: string;
  };
};

// ============================================================================
// List Legislatures Tool
// ============================================================================

/**
 * List all legislative sessions (legislaturas)
 */
async function listLegislaturesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListLegislaturesSchema,
    args,
    'legislaturas_listar'
  );

  context.logger.debug('Listing legislatures', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/plenario/lista/legislaturas',
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Legislaturas do Senado Federal:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list legislatures', error as Error);
    throw error;
  }
}

export const listLegislaturesTool: ToolDefinition = {
  name: 'legislaturas_listar',
  description:
    'Lista todas as legislaturas do Senado Federal. Uma legislatura corresponde a um período de 4 anos de mandato dos senadores.',
  inputSchema: zodToJsonSchema(ListLegislaturesSchema),
  handler: listLegislaturesHandler,
  category: 'reference',
};

// ============================================================================
// List Proposal Types Tool
// ============================================================================

/**
 * List all proposal types
 */
async function listProposalTypesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListProposalTypesSchema,
    args,
    'tipos_materia_listar'
  );

  context.logger.debug('Listing proposal types', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/tipoMateria/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Tipos de Matérias Legislativas:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list proposal types', error as Error);
    throw error;
  }
}

export const listProposalTypesTool: ToolDefinition = {
  name: 'tipos_materia_listar',
  description:
    'Lista todos os tipos de matérias legislativas (PLS, PEC, PLP, etc.). Útil para entender as diferentes categorias de proposições.',
  inputSchema: zodToJsonSchema(ListProposalTypesSchema),
  handler: listProposalTypesHandler,
  category: 'reference',
};

// ============================================================================
// List Proposal Statuses Tool
// ============================================================================

/**
 * List all proposal statuses
 */
async function listProposalStatusesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListProposalStatusesSchema,
    args,
    'situacoes_materia_listar'
  );

  context.logger.debug('Listing proposal statuses', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/situacaoMateria/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Situações de Matérias Legislativas:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list proposal statuses', error as Error);
    throw error;
  }
}

export const listProposalStatusesTool: ToolDefinition = {
  name: 'situacoes_materia_listar',
  description:
    'Lista todas as situações possíveis de matérias legislativas (em tramitação, arquivada, aprovada, etc.).',
  inputSchema: zodToJsonSchema(ListProposalStatusesSchema),
  handler: listProposalStatusesHandler,
  category: 'reference',
};

// ============================================================================
// List Committee Types Tool
// ============================================================================

/**
 * List all committee types
 */
async function listCommitteeTypesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListCommitteeTypesSchema,
    args,
    'tipos_comissao_listar'
  );

  context.logger.debug('Listing committee types', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/tipoComissao/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Tipos de Comissões:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list committee types', error as Error);
    throw error;
  }
}

export const listCommitteeTypesTool: ToolDefinition = {
  name: 'tipos_comissao_listar',
  description:
    'Lista todos os tipos de comissões do Senado (permanentes, temporárias, mistas, etc.).',
  inputSchema: zodToJsonSchema(ListCommitteeTypesSchema),
  handler: listCommitteeTypesHandler,
  category: 'reference',
};

// ============================================================================
// List States Tool
// ============================================================================

/**
 * List all Brazilian states
 */
async function listStatesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(
    ListStatesSchema,
    args,
    'ufs_listar'
  );

  context.logger.debug('Listing states', { params });

  try {
    const response = await context.httpClient.get<IBGEState[]>(
      IBGE_STATES_ENDPOINT,
      {}
    );

    if (!Array.isArray(response.data)) {
      context.logger.warn('Unexpected response format from IBGE states API');
      const fallbackText = JSON.stringify(response.data, null, 2);
      return {
        content: [
          {
            type: 'text',
            text: `Estados Brasileiros (dados brutos):\n\n${fallbackText}`,
          },
        ],
      };
    }

    const sortedStates = [...response.data].sort((a, b) =>
      a.sigla.localeCompare(b.sigla)
    );

    const totalStates = sortedStates.length;
    const page = Math.max(params.pagina ?? 1, 1);
    const pageSize = Math.max(params.itens ?? totalStates, 1);
    const startIndex = (page - 1) * pageSize;
    const paginatedStates = sortedStates.slice(
      startIndex,
      startIndex + pageSize
    );

    const lines = paginatedStates.map((state, index) => {
      const regionName = state.regiao?.nome || 'Não informado';
      return `${startIndex + index + 1}. ${state.nome} (${state.sigla}) - Região: ${regionName}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Estados Brasileiros (${paginatedStates.length} de ${totalStates}):\n\n${lines.join(
            '\n'
          )}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list states', error as Error);
    throw error;
  }
}

export const listStatesTool: ToolDefinition = {
  name: 'ufs_listar',
  description:
    'Lista todas as Unidades Federativas (estados) do Brasil. Cada estado elege 3 senadores.',
  inputSchema: zodToJsonSchema(ListStatesSchema),
  handler: listStatesHandler,
  category: 'reference',
};

// ============================================================================
// List Author Types Tool
// ============================================================================

async function listAuthorTypesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListAuthorTypesSchema, args, 'tipos_autor_listar');
  context.logger.debug('Listing author types', { params });

  try {
    const response = await context.httpClient.get<unknown>('/tipoAutor/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Tipos de Autores:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list author types', error as Error);
    throw error;
  }
}

export const listAuthorTypesTool: ToolDefinition = {
  name: 'tipos_autor_listar',
  description:
    'Lista todos os tipos de autores de matérias legislativas (senador, comissão, mesa, etc.).',
  inputSchema: zodToJsonSchema(ListAuthorTypesSchema),
  handler: listAuthorTypesHandler,
  category: 'reference',
};

// ============================================================================
// List Session Types Tool
// ============================================================================

async function listSessionTypesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListSessionTypesSchema, args, 'tipos_sessao_listar');
  context.logger.debug('Listing session types', { params });

  try {
    const response = await context.httpClient.get<unknown>('/tipoSessao/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Tipos de Sessão:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list session types', error as Error);
    throw error;
  }
}

export const listSessionTypesTool: ToolDefinition = {
  name: 'tipos_sessao_listar',
  description:
    'Lista todos os tipos de sessões plenárias do Senado (ordinária, extraordinária, solene, etc.).',
  inputSchema: zodToJsonSchema(ListSessionTypesSchema),
  handler: listSessionTypesHandler,
  category: 'reference',
};

// ============================================================================
// List Voting Types Tool
// ============================================================================

async function listVotingTypesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListVotingTypesSchema, args, 'tipos_votacao_listar');
  context.logger.debug('Listing voting types', { params });

  try {
    const response = await context.httpClient.get<unknown>('/tipoVotacao/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Tipos de Votação:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list voting types', error as Error);
    throw error;
  }
}

export const listVotingTypesTool: ToolDefinition = {
  name: 'tipos_votacao_listar',
  description:
    'Lista todos os tipos de votação do Senado (nominal, simbólica, secreta, etc.).',
  inputSchema: zodToJsonSchema(ListVotingTypesSchema),
  handler: listVotingTypesHandler,
  category: 'reference',
};

// ============================================================================
// List Document Types Tool
// ============================================================================

async function listDocumentTypesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListDocumentTypesSchema, args, 'tipos_documento_listar');
  context.logger.debug('Listing document types', { params });

  try {
    const response = await context.httpClient.get<unknown>('/tipoDocumento/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Tipos de Documento:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list document types', error as Error);
    throw error;
  }
}

export const listDocumentTypesTool: ToolDefinition = {
  name: 'tipos_documento_listar',
  description:
    'Lista todos os tipos de documentos legislativos (parecer, emenda, relatório, etc.).',
  inputSchema: zodToJsonSchema(ListDocumentTypesSchema),
  handler: listDocumentTypesHandler,
  category: 'reference',
};

// ============================================================================
// List Subjects Tool
// ============================================================================

async function listSubjectsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListSubjectsSchema, args, 'assuntos_listar');
  context.logger.debug('Listing subjects', { params });

  try {
    const response = await context.httpClient.get<unknown>('/assunto/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Assuntos Legislativos:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list subjects', error as Error);
    throw error;
  }
}

export const listSubjectsTool: ToolDefinition = {
  name: 'assuntos_listar',
  description:
    'Lista todos os assuntos/áreas temáticas das matérias legislativas (saúde, educação, economia, etc.).',
  inputSchema: zodToJsonSchema(ListSubjectsSchema),
  handler: listSubjectsHandler,
  category: 'reference',
};

// ============================================================================
// Export all reference tools
// ============================================================================

export const referenceTools: ToolDefinition[] = [
  listLegislaturesTool,
  listProposalTypesTool,
  listProposalStatusesTool,
  listCommitteeTypesTool,
  listStatesTool,
  listAuthorTypesTool,
  listSessionTypesTool,
  listVotingTypesTool,
  listDocumentTypesTool,
  listSubjectsTool,
];
