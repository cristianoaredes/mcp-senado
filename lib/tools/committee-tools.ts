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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/comissao/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Comissões do Senado Federal:\n\n${text}`,
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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/comissao/${params.codigo}`,
      {}
    );

    // Format response
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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/comissao/${params.codigo}/membros`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/comissao/${params.codigo}/reunioes`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/comissao/${params.codigo}/materias`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Matérias em Análise na Comissão:\n\n${text}`,
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
