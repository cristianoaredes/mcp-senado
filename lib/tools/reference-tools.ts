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

import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListLegislaturesSchema,
  ListProposalTypesSchema,
  ListProposalStatusesSchema,
  ListCommitteeTypesSchema,
  ListStatesSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

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
      '/legislatura/lista',
      params as Record<string, unknown>
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
  // Validate input
  const params = validateToolInput(
    ListStatesSchema,
    args,
    'ufs_listar'
  );

  context.logger.debug('Listing states', { params });

  try {
    // Call Senado API
    const response = await context.httpClient.get<unknown>(
      '/uf/lista',
      params as Record<string, unknown>
    );

    // Format response
    const text = JSON.stringify(response.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `Estados Brasileiros (UFs):\n\n${text}`,
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
// Export all reference tools
// ============================================================================

export const referenceTools: ToolDefinition[] = [
  listLegislaturesTool,
  listProposalTypesTool,
  listProposalStatusesTool,
  listCommitteeTypesTool,
  listStatesTool,
];
