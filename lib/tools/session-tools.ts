/**
 * Session/Plenary Tools
 *
 * Tools for accessing plenary session information:
 * - List plenary sessions
 * - Get session details
 * - Get session votings
 * - Get session speeches
 * - Get speech details
 * - Get plenary results by month
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import {
  ListSessionsSchema,
  SessionDetailsSchema,
  SessionVotingsSchema,
  SessionSpeechesSchema,
  SpeechDetailsSchema,
  PlenaryResultsByMonthSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../core/validation.js';

// ============================================================================
// List Sessions Tool
// ============================================================================

async function listSessionsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(ListSessionsSchema, args, 'sessoes_listar');
  context.logger.debug('Listing plenary sessions', { params });

  try {
    const response = await context.httpClient.get<unknown>('/sessao/lista', params as Record<string, unknown>);
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Sessões Plenárias:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to list plenary sessions', error as Error);
    throw error;
  }
}

export const listSessionsTool: ToolDefinition = {
  name: 'sessoes_listar',
  description:
    'Lista as sessões plenárias do Senado Federal. Permite filtrar por período e tipo de sessão (ordinária, extraordinária, solene, etc.).',
  inputSchema: zodToJsonSchema(ListSessionsSchema),
  handler: listSessionsHandler,
  category: 'session',
};

// ============================================================================
// Session Details Tool
// ============================================================================

async function sessionDetailsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(SessionDetailsSchema, args, 'sessao_detalhes');
  context.logger.debug('Getting session details', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/sessao/${params.codigo}`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Detalhes da Sessão:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get session details', error as Error);
    throw error;
  }
}

export const sessionDetailsTool: ToolDefinition = {
  name: 'sessao_detalhes',
  description:
    'Obtém informações detalhadas sobre uma sessão plenária específica. Inclui data, hora, tipo, pauta, e presidência da sessão.',
  inputSchema: zodToJsonSchema(SessionDetailsSchema),
  handler: sessionDetailsHandler,
  category: 'session',
};

// ============================================================================
// Session Votings Tool
// ============================================================================

async function sessionVotingsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(SessionVotingsSchema, args, 'sessao_votacoes');
  context.logger.debug('Getting session votings', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/sessao/${params.codigo}/votacoes`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Votações da Sessão:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get session votings', error as Error);
    throw error;
  }
}

export const sessionVotingsTool: ToolDefinition = {
  name: 'sessao_votacoes',
  description:
    'Lista todas as votações realizadas em uma sessão plenária específica. Mostra as matérias votadas e os resultados.',
  inputSchema: zodToJsonSchema(SessionVotingsSchema),
  handler: sessionVotingsHandler,
  category: 'session',
};

// ============================================================================
// Session Speeches Tool
// ============================================================================

async function sessionSpeechesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(SessionSpeechesSchema, args, 'sessao_discursos');
  context.logger.debug('Getting session speeches', { params });

  try {
    const response = await context.httpClient.get<unknown>(
      `/sessao/${params.codigo}/discursos`,
      params as Record<string, unknown>
    );
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Discursos da Sessão:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get session speeches', error as Error);
    throw error;
  }
}

export const sessionSpeechesTool: ToolDefinition = {
  name: 'sessao_discursos',
  description:
    'Lista todos os discursos proferidos em uma sessão plenária específica. Inclui informações sobre cada orador e resumo dos discursos.',
  inputSchema: zodToJsonSchema(SessionSpeechesSchema),
  handler: sessionSpeechesHandler,
  category: 'session',
};

// ============================================================================
// Speech Details Tool
// ============================================================================

async function speechDetailsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(SpeechDetailsSchema, args, 'discurso_detalhes');
  context.logger.debug('Getting speech details', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/discurso/${params.codigo}`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Detalhes do Discurso:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get speech details', error as Error);
    throw error;
  }
}

export const speechDetailsTool: ToolDefinition = {
  name: 'discurso_detalhes',
  description:
    'Obtém informações detalhadas sobre um discurso específico. Inclui texto completo ou resumo, orador, data, sessão, e indexação temática.',
  inputSchema: zodToJsonSchema(SpeechDetailsSchema),
  handler: speechDetailsHandler,
  category: 'session',
};

// ============================================================================
// Plenary Results By Month Tool
// ============================================================================

async function plenaryResultsByMonthHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const params = validateToolInput(PlenaryResultsByMonthSchema, args, 'plenario_resultados_mes');
  context.logger.debug('Getting plenary results by month', { params });

  try {
    const response = await context.httpClient.get<unknown>(`/plenario/resultado/mes/${params.data}`, {});
    const text = JSON.stringify(response.data, null, 2);
    return {
      content: [{ type: 'text', text: `Resultados do Plenário:\n\n${text}` }],
    };
  } catch (error) {
    context.logger.error('Failed to get plenary results by month', error as Error);
    throw error;
  }
}

export const plenaryResultsByMonthTool: ToolDefinition = {
  name: 'plenario_resultados_mes',
  description:
    'Obtém um resumo dos resultados e atividades do plenário do Senado em um mês específico. Formato da data: YYYYMMDD.',
  inputSchema: zodToJsonSchema(PlenaryResultsByMonthSchema),
  handler: plenaryResultsByMonthHandler,
  category: 'session',
};

// ============================================================================
// Export all session tools
// ============================================================================

export const sessionTools: ToolDefinition[] = [
  listSessionsTool,
  sessionDetailsTool,
  sessionVotingsTool,
  sessionSpeechesTool,
  speechDetailsTool,
  plenaryResultsByMonthTool,
];
