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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/partido/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Partidos Políticos do Senado Federal:\n\n${text}`,
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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/partido/${params.codigo}`,
      {}
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/partido/${params.codigo}/senadores`,
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/bloco/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Blocos Parlamentares do Senado Federal:\n\n${text}`,
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
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      `/bloco/${params.codigo}`,
      {}
    );

    // Format response
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
