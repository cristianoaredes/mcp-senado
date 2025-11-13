/**
 * Senator Tools
 *
 * Tools for accessing senator information:
 * - List senators with filters
 * - Get senator details
 * - Get voting history
 * - Get authored proposals
 * - Get committee memberships
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListSenatorsSchema,
  SenatorDetailsSchema,
  SenatorVotingSchema,
  SenatorAuthorshipsSchema,
  SenatorCommitteesSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

// ============================================================================
// List Senators Tool
// ============================================================================

/**
 * List senators with optional filters
 */
async function listSenatorsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    ListSenatorsSchema,
    args,
    'senadores_listar'
  );

  context.logger.debug('Listing senators', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/senador/lista/atual',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Senadores do Senado Federal:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to list senators', error as Error);
    throw error;
  }
}

export const listSenatorsTool: ToolDefinition = {
  name: 'senadores_listar',
  description:
    'Lista senadores em exercício no Senado Federal. Permite filtrar por nome, partido, UF (estado) e legislatura. Retorna informações básicas como nome completo, nome parlamentar, partido, UF e situação.',
  inputSchema: zodToJsonSchema(ListSenatorsSchema),
  handler: listSenatorsHandler,
  category: 'senator',
};

// ============================================================================
// Senator Details Tool
// ============================================================================

/**
 * Get detailed information about a specific senator
 */
async function senatorDetailsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    SenatorDetailsSchema,
    args,
    'senador_detalhes'
  );

  context.logger.debug('Getting senator details', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Detalhes do Senador:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get senator details', error as Error);
    throw error;
  }
}

export const senatorDetailsTool: ToolDefinition = {
  name: 'senador_detalhes',
  description:
    'Obtém informações detalhadas sobre um senador específico. Inclui dados pessoais, biografia, formação acadêmica, telefones, endereços, e-mails, mandato atual, partido, UF, e outras informações relevantes.',
  inputSchema: zodToJsonSchema(SenatorDetailsSchema),
  handler: senatorDetailsHandler,
  category: 'senator',
};

// ============================================================================
// Senator Voting History Tool
// ============================================================================

/**
 * Get voting history for a specific senator
 */
async function senatorVotingHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    SenatorVotingSchema,
    args,
    'senador_votacoes'
  );

  context.logger.debug('Getting senator voting history', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/votacoes`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Histórico de Votações do Senador:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get senator voting history', error as Error);
    throw error;
  }
}

export const senatorVotingTool: ToolDefinition = {
  name: 'senador_votacoes',
  description:
    'Obtém o histórico de votações de um senador específico. Lista todas as votações em que o senador participou, incluindo a matéria votada, data, resultado da votação, e o voto do senador. Permite filtrar por período.',
  inputSchema: zodToJsonSchema(SenatorVotingSchema),
  handler: senatorVotingHandler,
  category: 'senator',
};

// ============================================================================
// Senator Authorships Tool
// ============================================================================

/**
 * Get proposals authored by a specific senator
 */
async function senatorAuthorshipsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    SenatorAuthorshipsSchema,
    args,
    'senador_autorias'
  );

  context.logger.debug('Getting senator authorships', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/autorias`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Matérias de Autoria do Senador:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get senator authorships', error as Error);
    throw error;
  }
}

export const senatorAuthorshipsTool: ToolDefinition = {
  name: 'senador_autorias',
  description:
    'Lista todas as matérias legislativas (projetos de lei, emendas, requerimentos, etc.) de autoria de um senador específico. Permite filtrar por tipo de matéria e período. Útil para analisar a produção legislativa do senador.',
  inputSchema: zodToJsonSchema(SenatorAuthorshipsSchema),
  handler: senatorAuthorshipsHandler,
  category: 'senator',
};

// ============================================================================
// Senator Committees Tool
// ============================================================================

/**
 * Get committee memberships for a specific senator
 */
async function senatorCommitteesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  // Validate input
  const params = validateToolInput(
    SenatorCommitteesSchema,
    args,
    'senador_comissoes'
  );

  context.logger.debug('Getting senator committees', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/comissoes`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Participação em Comissões do Senador:\n\n${text}`,
        },
      ],
    };
  } catch (error) {
    context.logger.error('Failed to get senator committees', error as Error);
    throw error;
  }
}

export const senatorCommitteesTool: ToolDefinition = {
  name: 'senador_comissoes',
  description:
    'Lista todas as comissões das quais um senador é ou foi membro. Inclui informação sobre o cargo ocupado (presidente, vice-presidente, titular, suplente) e o período de participação. Permite filtrar por legislatura.',
  inputSchema: zodToJsonSchema(SenatorCommitteesSchema),
  handler: senatorCommitteesHandler,
  category: 'senator',
};

// ============================================================================
// Export all senator tools
// ============================================================================

export const senatorTools: ToolDefinition[] = [
  listSenatorsTool,
  senatorDetailsTool,
  senatorVotingTool,
  senatorAuthorshipsTool,
  senatorCommitteesTool,
];
