/**
 * Voting Tools
 *
 * Tools for accessing voting session information:
 * - List voting sessions by date
 * - Get voting details
 * - Get individual votes
 * - Get party orientations
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListVotingsSchema,
  VotingDetailsSchema,
  VotingVotesSchema,
  VotingOrientationsSchema,
  VotingStatisticsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

// ============================================================================
// List Voting Sessions Tool
// ============================================================================

/**
 * List voting sessions by date
 */
async function listVotingsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListVotingsSchema,
    args,
    'votacoes_listar'
  );

  context.logger.debug('Listing voting sessions', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/votacao/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Votações do Senado Federal:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list voting sessions', error as Error);
    throw error;
  }
}

export const listVotingsTool: ToolDefinition = {
  name: 'votacoes_listar',
  description:
    'Lista todas as votações realizadas no Senado Federal em uma data específica. Retorna informações sobre cada votação, incluindo a matéria votada, resultado, e tipo de votação.',
  inputSchema: zodToJsonSchema(ListVotingsSchema),
  handler: listVotingsHandler,
  category: 'voting',
};

// ============================================================================
// Voting Details Tool
// ============================================================================

/**
 * Get detailed information about a specific voting session
 */
async function votingDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    VotingDetailsSchema,
    args,
    'votacao_detalhes'
  );

  context.logger.debug('Getting voting details', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/votacao/${params.codigo}`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes da Votação:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get voting details', error as Error);
    throw error;
  }
}

export const votingDetailsTool: ToolDefinition = {
  name: 'votacao_detalhes',
  description:
    'Obtém informações detalhadas sobre uma votação específica. Inclui matéria votada, data e hora, tipo de votação, resultado, placar (votos sim, não, abstenções), e sessão na qual ocorreu.',
  inputSchema: zodToJsonSchema(VotingDetailsSchema),
  handler: votingDetailsHandler,
  category: 'voting',
};

// ============================================================================
// Voting Individual Votes Tool
// ============================================================================

/**
 * Get individual votes for a specific voting session
 */
async function votingVotesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    VotingVotesSchema,
    args,
    'votacao_votos'
  );

  context.logger.debug('Getting individual votes', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/votacao/${params.codigo}/votos`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Votos Individuais da Votação:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get individual votes', error as Error);
    throw error;
  }
}

export const votingVotesTool: ToolDefinition = {
  name: 'votacao_votos',
  description:
    'Lista todos os votos individuais de uma votação específica. Mostra como cada senador votou (sim, não, abstenção, obstrução, etc.), permitindo análise detalhada do comportamento parlamentar.',
  inputSchema: zodToJsonSchema(VotingVotesSchema),
  handler: votingVotesHandler,
  category: 'voting',
};

// ============================================================================
// Voting Party Orientations Tool
// ============================================================================

/**
 * Get party orientations for a specific voting session
 */
async function votingOrientationsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    VotingOrientationsSchema,
    args,
    'votacao_orientacoes'
  );

  context.logger.debug('Getting party orientations', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/votacao/${params.codigo}/orientacoes`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Orientações Partidárias da Votação:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get party orientations', error as Error);
    throw error;
  }
}

export const votingOrientationsTool: ToolDefinition = {
  name: 'votacao_orientacoes',
  description:
    'Obtém as orientações de voto de cada bancada partidária em uma votação específica. Mostra como cada partido orientou seus senadores a votarem, permitindo análise de coesão partidária e alinhamentos políticos.',
  inputSchema: zodToJsonSchema(VotingOrientationsSchema),
  handler: votingOrientationsHandler,
  category: 'voting',
};

// ============================================================================
// Voting Statistics Tool
// ============================================================================

async function votingStatisticsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(VotingStatisticsSchema, args, 'votacao_estatisticas');
  context.logger.debug('Getting voting statistics', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/votacao/${params.codigo}/estatisticas`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Estatísticas da Votação:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get voting statistics', error as Error);
    throw error;
  }
}

export const votingStatisticsTool: ToolDefinition = {
  name: 'votacao_estatisticas',
  description:
    'Obtém estatísticas detalhadas de uma votação. Inclui análises por partido, UF, gênero, e outras métricas estatísticas sobre o comportamento dos senadores na votação.',
  inputSchema: zodToJsonSchema(VotingStatisticsSchema),
  handler: votingStatisticsHandler,
  category: 'voting',
};

// ============================================================================
// Export all voting tools
// ============================================================================

export const votingTools: ToolDefinition[] = [
  listVotingsTool,
  votingDetailsTool,
  votingVotesTool,
  votingOrientationsTool,
  votingStatisticsTool,
];
