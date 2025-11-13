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
  SenatorLeavesSchema,
  SenatorMandatesSchema,
  SenatorLeadershipSchema,
  SenatorPositionsSchema,
  SenatorRemarksSchema,
  SenatorSpeechesSchema,
  SenatorRapporteurshipsSchema,
  SenatorAffiliationsSchema,
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
// Senator Leaves Tool
// ============================================================================

async function senatorLeavesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorLeavesSchema, args, 'senador_licencas');
  context.logger.debug('Getting senator leaves', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/licencas`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Licenças e Afastamentos do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator leaves', error as Error);
    throw error;
  }
}

export const senatorLeavesTool: ToolDefinition = {
  name: 'senador_licencas',
  description:
    'Lista todas as licenças e afastamentos de um senador. Inclui tipo de licença (saúde, particular, etc.), período de afastamento, e motivo quando disponível.',
  inputSchema: zodToJsonSchema(SenatorLeavesSchema),
  handler: senatorLeavesHandler,
  category: 'senator',
};

// ============================================================================
// Senator Mandates Tool
// ============================================================================

async function senatorMandatesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorMandatesSchema, args, 'senador_mandatos');
  context.logger.debug('Getting senator mandates', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/mandatos`,
      {}
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Histórico de Mandatos do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator mandates', error as Error);
    throw error;
  }
}

export const senatorMandatesTool: ToolDefinition = {
  name: 'senador_mandatos',
  description:
    'Obtém o histórico completo de mandatos de um senador. Lista todos os mandatos exercidos, incluindo períodos, UF representada, e suplências.',
  inputSchema: zodToJsonSchema(SenatorMandatesSchema),
  handler: senatorMandatesHandler,
  category: 'senator',
};

// ============================================================================
// Senator Leadership Tool
// ============================================================================

async function senatorLeadershipHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorLeadershipSchema, args, 'senador_liderancas');
  context.logger.debug('Getting senator leadership positions', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/liderancas`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Lideranças Exercidas pelo Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator leadership', error as Error);
    throw error;
  }
}

export const senatorLeadershipTool: ToolDefinition = {
  name: 'senador_liderancas',
  description:
    'Lista todas as posições de liderança exercidas por um senador. Inclui liderança de partido, de bloco parlamentar, de governo ou de oposição, com períodos de exercício.',
  inputSchema: zodToJsonSchema(SenatorLeadershipSchema),
  handler: senatorLeadershipHandler,
  category: 'senator',
};

// ============================================================================
// Senator Positions Tool
// ============================================================================

async function senatorPositionsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorPositionsSchema, args, 'senador_cargos');
  context.logger.debug('Getting senator positions', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/cargos`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Cargos e Funções do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator positions', error as Error);
    throw error;
  }
}

export const senatorPositionsTool: ToolDefinition = {
  name: 'senador_cargos',
  description:
    'Lista todos os cargos e funções exercidos por um senador no Senado Federal. Inclui cargos na Mesa Diretora, em comissões, e outras funções institucionais.',
  inputSchema: zodToJsonSchema(SenatorPositionsSchema),
  handler: senatorPositionsHandler,
  category: 'senator',
};

// ============================================================================
// Senator Remarks Tool
// ============================================================================

async function senatorRemarksHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorRemarksSchema, args, 'senador_apartes');
  context.logger.debug('Getting senator remarks', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/apartes`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Apartes do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator remarks', error as Error);
    throw error;
  }
}

export const senatorRemarksTool: ToolDefinition = {
  name: 'senador_apartes',
  description:
    'Lista todos os apartes (interrupções e comentários) realizados por um senador durante discursos de outros parlamentares. Permite filtrar por período.',
  inputSchema: zodToJsonSchema(SenatorRemarksSchema),
  handler: senatorRemarksHandler,
  category: 'senator',
};

// ============================================================================
// Senator Speeches Tool
// ============================================================================

async function senatorSpeechesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorSpeechesSchema, args, 'senador_discursos');
  context.logger.debug('Getting senator speeches', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/discursos`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Discursos do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator speeches', error as Error);
    throw error;
  }
}

export const senatorSpeechesTool: ToolDefinition = {
  name: 'senador_discursos',
  description:
    'Lista todos os discursos proferidos por um senador no plenário do Senado Federal. Inclui data, tipo de sessão, e resumo do discurso. Permite filtrar por período.',
  inputSchema: zodToJsonSchema(SenatorSpeechesSchema),
  handler: senatorSpeechesHandler,
  category: 'senator',
};

// ============================================================================
// Senator Rapporteurships Tool
// ============================================================================

async function senatorRapporteurshipsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorRapporteurshipsSchema, args, 'senador_relatorias');
  context.logger.debug('Getting senator rapporteurships', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/relatorias`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Relatorias do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator rapporteurships', error as Error);
    throw error;
  }
}

export const senatorRapporteurshipsTool: ToolDefinition = {
  name: 'senador_relatorias',
  description:
    'Lista todas as matérias legislativas das quais o senador foi relator. Inclui informações sobre a matéria, comissão, e status do parecer.',
  inputSchema: zodToJsonSchema(SenatorRapporteurshipsSchema),
  handler: senatorRapporteurshipsHandler,
  category: 'senator',
};

// ============================================================================
// Senator Affiliations Tool
// ============================================================================

async function senatorAffiliationsHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const params = validateToolInput(SenatorAffiliationsSchema, args, 'senador_filiacoes');
  context.logger.debug('Getting senator party affiliations', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/senador/${params.codigo}/filiacoes`,
      {}
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{
        type: 'text',
        text: `Histórico de Filiações Partidárias do Senador:\n\n${text}`,
      }],
    };
  } catch (error) {
    context.logger.error('Failed to get senator affiliations', error as Error);
    throw error;
  }
}

export const senatorAffiliationsTool: ToolDefinition = {
  name: 'senador_filiacoes',
  description:
    'Obtém o histórico completo de filiações partidárias de um senador. Lista todos os partidos pelos quais o senador passou, com datas de filiação e desfiliação.',
  inputSchema: zodToJsonSchema(SenatorAffiliationsSchema),
  handler: senatorAffiliationsHandler,
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
  senatorLeavesTool,
  senatorMandatesTool,
  senatorLeadershipTool,
  senatorPositionsTool,
  senatorRemarksTool,
  senatorSpeechesTool,
  senatorRapporteurshipsTool,
  senatorAffiliationsTool,
];
