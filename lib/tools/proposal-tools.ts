/**
 * Proposal Tools
 *
 * Tools for accessing legislative proposal information:
 * - Search proposals with filters
 * - Get proposal details
 * - Get voting history
 * - Get processing history
 * - Get proposal texts
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  SearchProposalsSchema,
  ProposalDetailsSchema,
  ProposalVotingSchema,
  ProposalProcessingSchema,
  ProposalTextsSchema,
  ProposalAuthorsSchema,
  RelatedProposalsSchema,
  ProposalRapporteurshipsSchema,
  ListProposalsInProcessSchema,
  ListUpdatedProposalsSchema,
  ProposalsByYearSchema,
  ProposalAmendmentsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

// ============================================================================
// Search Proposals Tool
// ============================================================================

/**
 * Search for legislative proposals with filters
 */
async function searchProposalsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    SearchProposalsSchema,
    args,
    'materias_pesquisar'
  );

  context.logger.debug('Searching proposals', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/materia/pesquisa/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Resultado da Pesquisa de Matérias:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to search proposals', error as Error);
    throw error;
  }
}

export const searchProposalsTool: ToolDefinition = {
  name: 'materias_pesquisar',
  description:
    'Pesquisa matérias legislativas no Senado Federal. Permite filtrar por tipo (PLS, PEC, PLP, etc.), número, ano, autor, assunto e palavras-chave. Também permite filtrar apenas matérias em tramitação ou por período específico.',
  inputSchema: zodToJsonSchema(SearchProposalsSchema),
  handler: searchProposalsHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Details Tool
// ============================================================================

/**
 * Get detailed information about a specific proposal
 */
async function proposalDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ProposalDetailsSchema,
    args,
    'materia_detalhes'
  );

  context.logger.debug('Getting proposal details', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/materia/${params.codigo}`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes da Matéria:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal details', error as Error);
    throw error;
  }
}

export const proposalDetailsTool: ToolDefinition = {
  name: 'materia_detalhes',
  description:
    'Obtém informações detalhadas sobre uma matéria legislativa específica. Inclui tipo, número, ano, ementa, explicação da ementa, autores, local de tramitação, situação atual, e outras informações relevantes.',
  inputSchema: zodToJsonSchema(ProposalDetailsSchema),
  handler: proposalDetailsHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Voting History Tool
// ============================================================================

/**
 * Get voting history for a specific proposal
 */
async function proposalVotingHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ProposalVotingSchema,
    args,
    'materia_votacoes'
  );

  context.logger.debug('Getting proposal voting history', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/materia/${params.codigo}/votacoes`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Votações da Matéria:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal voting history', error as Error);
    throw error;
  }
}

export const proposalVotingTool: ToolDefinition = {
  name: 'materia_votacoes',
  description:
    'Lista todas as votações realizadas sobre uma matéria legislativa específica. Inclui data, resultado, placar (votos sim, não, abstenções), e o tipo de votação (nominal, simbólica, etc.).',
  inputSchema: zodToJsonSchema(ProposalVotingSchema),
  handler: proposalVotingHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Processing History Tool
// ============================================================================

/**
 * Get processing/tramitation history for a specific proposal
 */
async function proposalProcessingHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ProposalProcessingSchema,
    args,
    'materia_tramitacoes'
  );

  context.logger.debug('Getting proposal processing history', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/materia/${params.codigo}/tramitacoes`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Tramitações da Matéria:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal processing history', error as Error);
    throw error;
  }
}

export const proposalProcessingTool: ToolDefinition = {
  name: 'materia_tramitacoes',
  description:
    'Obtém o histórico completo de tramitação de uma matéria legislativa. Mostra cada movimentação da matéria, incluindo data, origem, destino, ação realizada e situação. Permite filtrar por período.',
  inputSchema: zodToJsonSchema(ProposalProcessingSchema),
  handler: proposalProcessingHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Texts Tool
// ============================================================================

/**
 * Get all texts associated with a proposal
 */
async function proposalTextsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ProposalTextsSchema,
    args,
    'materia_textos'
  );

  context.logger.debug('Getting proposal texts', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/materia/${params.codigo}/textos`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Textos da Matéria:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal texts', error as Error);
    throw error;
  }
}

export const proposalTextsTool: ToolDefinition = {
  name: 'materia_textos',
  description:
    'Lista todos os textos disponíveis de uma matéria legislativa. Inclui texto inicial, substitutivos, pareceres, emendas, e versões finais. Fornece URLs para download dos documentos em diversos formatos (PDF, RTF, etc.).',
  inputSchema: zodToJsonSchema(ProposalTextsSchema),
  handler: proposalTextsHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Authors Tool
// ============================================================================

async function proposalAuthorsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ProposalAuthorsSchema, args, 'materia_autores');
  context.logger.debug('Getting proposal authors', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/materia/${params.codigo}/autores`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Autores da Matéria:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal authors', error as Error);
    throw error;
  }
}

export const proposalAuthorsTool: ToolDefinition = {
  name: 'materia_autores',
  description:
    'Lista todos os autores de uma matéria legislativa. Inclui autor principal e coautores, com informações sobre cada parlamentar.',
  inputSchema: zodToJsonSchema(ProposalAuthorsSchema),
  handler: proposalAuthorsHandler,
  category: 'proposal',
};

// ============================================================================
// Related Proposals Tool
// ============================================================================

async function relatedProposalsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(RelatedProposalsSchema, args, 'materia_relacionadas');
  context.logger.debug('Getting related proposals', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/materia/${params.codigo}/relacionadas`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Matérias Relacionadas:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get related proposals', error as Error);
    throw error;
  }
}

export const relatedProposalsTool: ToolDefinition = {
  name: 'materia_relacionadas',
  description:
    'Lista todas as matérias relacionadas a uma matéria específica. Inclui matérias apensadas, substitutivos, e outras relações legislativas.',
  inputSchema: zodToJsonSchema(RelatedProposalsSchema),
  handler: relatedProposalsHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Rapporteurships Tool
// ============================================================================

async function proposalRapporteurshipsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ProposalRapporteurshipsSchema, args, 'materia_relatorias');
  context.logger.debug('Getting proposal rapporteurships', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/materia/${params.codigo}/relatorias`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Relatorias da Matéria:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal rapporteurships', error as Error);
    throw error;
  }
}

export const proposalRapporteurshipsTool: ToolDefinition = {
  name: 'materia_relatorias',
  description:
    'Lista todos os relatores designados para uma matéria, incluindo relator atual e histórico de relatores em diferentes comissões.',
  inputSchema: zodToJsonSchema(ProposalRapporteurshipsSchema),
  handler: proposalRapporteurshipsHandler,
  category: 'proposal',
};

// ============================================================================
// List Proposals In Process Tool
// ============================================================================

async function listProposalsInProcessHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListProposalsInProcessSchema, args, 'materias_tramitando');
  context.logger.debug('Listing proposals in process', { params });

  try {
    const response = await context.httpClient.get<unknown>('/materia/tramitando', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Matérias em Tramitação:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list proposals in process', error as Error);
    throw error;
  }
}

export const listProposalsInProcessTool: ToolDefinition = {
  name: 'materias_tramitando',
  description:
    'Lista todas as matérias legislativas que estão atualmente em tramitação no Senado Federal. Permite filtrar por data e hora de referência.',
  inputSchema: zodToJsonSchema(ListProposalsInProcessSchema),
  handler: listProposalsInProcessHandler,
  category: 'proposal',
};

// ============================================================================
// List Updated Proposals Tool
// ============================================================================

async function listUpdatedProposalsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListUpdatedProposalsSchema, args, 'materias_atualizadas');
  context.logger.debug('Listing updated proposals', { params });

  try {
    const response = await context.httpClient.get<unknown>('/materia/atualizadas', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Matérias Recentemente Atualizadas:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list updated proposals', error as Error);
    throw error;
  }
}

export const listUpdatedProposalsTool: ToolDefinition = {
  name: 'materias_atualizadas',
  description:
    'Lista todas as matérias legislativas que foram recentemente atualizadas. Útil para acompanhar mudanças e movimentações recentes.',
  inputSchema: zodToJsonSchema(ListUpdatedProposalsSchema),
  handler: listUpdatedProposalsHandler,
  category: 'proposal',
};

// ============================================================================
// Proposals By Year Tool
// ============================================================================

async function proposalsByYearHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ProposalsByYearSchema, args, 'materias_ano');
  context.logger.debug('Getting proposals by year', { params });

  try {
    const response = await context.httpClient.get<unknown>('/materia/ano', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Matérias por Ano:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get proposals by year', error as Error);
    throw error;
  }
}

export const proposalsByYearTool: ToolDefinition = {
  name: 'materias_ano',
  description:
    'Lista todas as matérias legislativas de um ano específico. Permite filtrar por tipo de matéria (PLS, PEC, PLP, etc.).',
  inputSchema: zodToJsonSchema(ProposalsByYearSchema),
  handler: proposalsByYearHandler,
  category: 'proposal',
};

// ============================================================================
// Proposal Amendments Tool
// ============================================================================

async function proposalAmendmentsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ProposalAmendmentsSchema, args, 'materia_emendas');
  context.logger.debug('Getting proposal amendments', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/materia/${params.codigo}/emendas`, params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Emendas da Matéria:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get proposal amendments', error as Error);
    throw error;
  }
}

export const proposalAmendmentsTool: ToolDefinition = {
  name: 'materia_emendas',
  description:
    'Lista todas as emendas apresentadas a uma matéria legislativa. Inclui emendas de plenário, de comissão, e substitutivos.',
  inputSchema: zodToJsonSchema(ProposalAmendmentsSchema),
  handler: proposalAmendmentsHandler,
  category: 'proposal',
};

// ============================================================================
// Export all proposal tools
// ============================================================================

export const proposalTools: ToolDefinition[] = [
  searchProposalsTool,
  proposalDetailsTool,
  proposalVotingTool,
  proposalProcessingTool,
  proposalTextsTool,
  proposalAuthorsTool,
  relatedProposalsTool,
  proposalRapporteurshipsTool,
  listProposalsInProcessTool,
  listUpdatedProposalsTool,
  proposalsByYearTool,
  proposalAmendmentsTool,
];
