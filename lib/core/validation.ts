/**
 * Input Validation with Zod
 *
 * Features:
 * - Zod schemas for all tool inputs
 * - JSON Schema conversion for MCP protocol
 * - Input sanitization
 * - Validation error handling
 */

import { z } from 'zod';
import { ValidationError } from './errors.js';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  pagina: z.number().int().min(1).optional().describe('Número da página'),
  itens: z.number().int().min(1).max(100).optional().describe('Itens por página'),
});

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Data inicial (YYYY-MM-DD)'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Data final (YYYY-MM-DD)'),
});

/**
 * Code/ID schema (for senator, proposal, etc.)
 */
export const CodeSchema = z.number().int().positive().describe('Código identificador');

/**
 * Legislature number schema
 */
export const LegislatureSchema = z.number().int().min(1).describe('Número da legislatura');

/**
 * UF (State) schema - Brazilian state codes
 */
export const UFSchema = z.string().length(2).toUpperCase().describe('Sigla do estado (UF)');

// ============================================================================
// Senator Tool Schemas
// ============================================================================

/**
 * List senators schema
 */
export const ListSenatorsSchema = z.object({
  nome: z.string().max(100).optional().describe('Nome do senador (busca parcial)'),
  partido: z.string().max(20).optional().describe('Sigla do partido'),
  uf: UFSchema.optional(),
  legislatura: LegislatureSchema.optional(),
  ...PaginationSchema.shape,
});

/**
 * Senator details schema
 */
export const SenatorDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código do senador'),
});

/**
 * Senator voting history schema
 */
export const SenatorVotingSchema = z.object({
  codigo: CodeSchema.describe('Código do senador'),
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
});

/**
 * Senator authorships schema
 */
export const SenatorAuthorshipsSchema = z.object({
  codigo: CodeSchema.describe('Código do senador'),
  tipo: z.string().max(20).optional().describe('Tipo de matéria'),
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
});

/**
 * Senator committees schema
 */
export const SenatorCommitteesSchema = z.object({
  codigo: CodeSchema.describe('Código do senador'),
  legislatura: LegislatureSchema.optional(),
});

// ============================================================================
// Proposal Tool Schemas
// ============================================================================

/**
 * Search proposals schema
 */
export const SearchProposalsSchema = z.object({
  sigla: z.string().max(20).optional().describe('Sigla do tipo de matéria (PLS, PEC, etc.)'),
  numero: z.number().int().positive().optional().describe('Número da matéria'),
  ano: z.number().int().min(1900).max(2100).optional().describe('Ano da matéria'),
  autor: z.string().max(100).optional().describe('Nome do autor'),
  assunto: z.string().max(200).optional().describe('Palavras-chave no assunto'),
  tramitando: z.boolean().optional().describe('Apenas matérias em tramitação'),
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
});

/**
 * Proposal details schema
 */
export const ProposalDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código da matéria'),
});

/**
 * Proposal voting history schema
 */
export const ProposalVotingSchema = z.object({
  codigo: CodeSchema.describe('Código da matéria'),
  ...PaginationSchema.shape,
});

/**
 * Proposal processing history schema
 */
export const ProposalProcessingSchema = z.object({
  codigo: CodeSchema.describe('Código da matéria'),
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
});

/**
 * Proposal texts schema
 */
export const ProposalTextsSchema = z.object({
  codigo: CodeSchema.describe('Código da matéria'),
});

// ============================================================================
// Voting Tool Schemas
// ============================================================================

/**
 * List voting sessions schema
 */
export const ListVotingsSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data da votação (YYYY-MM-DD)'),
  ...PaginationSchema.shape,
});

/**
 * Voting details schema
 */
export const VotingDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código da votação'),
});

/**
 * Individual votes schema
 */
export const VotingVotesSchema = z.object({
  codigo: CodeSchema.describe('Código da votação'),
});

/**
 * Party orientations schema
 */
export const VotingOrientationsSchema = z.object({
  codigo: CodeSchema.describe('Código da votação'),
});

// ============================================================================
// Committee Tool Schemas
// ============================================================================

/**
 * List committees schema
 */
export const ListCommitteesSchema = z.object({
  tipo: z.string().max(50).optional().describe('Tipo de comissão'),
  sigla: z.string().max(20).optional().describe('Sigla da comissão'),
  ...PaginationSchema.shape,
});

/**
 * Committee details schema
 */
export const CommitteeDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código da comissão'),
});

/**
 * Committee members schema
 */
export const CommitteeMembersSchema = z.object({
  codigo: CodeSchema.describe('Código da comissão'),
  legislatura: LegislatureSchema.optional(),
});

/**
 * Committee meetings schema
 */
export const CommitteeMeetingsSchema = z.object({
  codigo: CodeSchema.describe('Código da comissão'),
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
});

/**
 * Committee proposals schema
 */
export const CommitteeProposalsSchema = z.object({
  codigo: CodeSchema.describe('Código da comissão'),
  ...PaginationSchema.shape,
});

// ============================================================================
// Party Tool Schemas
// ============================================================================

/**
 * List parties schema
 */
export const ListPartiesSchema = z.object({
  ...PaginationSchema.shape,
});

/**
 * Party details schema
 */
export const PartyDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código do partido'),
});

/**
 * Party senators schema
 */
export const PartySenatorsSchema = z.object({
  codigo: CodeSchema.describe('Código do partido'),
  legislatura: LegislatureSchema.optional(),
});

/**
 * List blocs schema
 */
export const ListBlocsSchema = z.object({
  legislatura: LegislatureSchema.optional(),
  ...PaginationSchema.shape,
});

/**
 * Bloc details schema
 */
export const BlocDetailsSchema = z.object({
  codigo: CodeSchema.describe('Código do bloco parlamentar'),
});

// ============================================================================
// Reference Data Tool Schemas
// ============================================================================

/**
 * List legislatures schema
 */
export const ListLegislaturesSchema = z.object({
  ...PaginationSchema.shape,
});

/**
 * List proposal types schema
 */
export const ListProposalTypesSchema = z.object({
  ...PaginationSchema.shape,
});

/**
 * List proposal statuses schema
 */
export const ListProposalStatusesSchema = z.object({
  ...PaginationSchema.shape,
});

/**
 * List committee types schema
 */
export const ListCommitteeTypesSchema = z.object({
  ...PaginationSchema.shape,
});

/**
 * List states schema
 */
export const ListStatesSchema = z.object({
  ...PaginationSchema.shape,
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate tool input using Zod schema
 */
export function validateToolInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  toolName: string
): T {
  try {
    // Parse and validate
    const result = schema.parse(input);

    // Sanitize strings (trim whitespace)
    return sanitizeInput(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get first error for simplicity
      const firstError = error.errors[0];
      if (firstError) {
        throw new ValidationError(
          `Invalid input for ${toolName}: ${firstError.message}`,
          firstError.path.join('.') || 'input',
          input
        );
      }
    }

    throw new ValidationError(
      `Invalid input for ${toolName}`,
      'input',
      input
    );
  }
}

/**
 * Sanitize input (trim strings, etc.)
 */
function sanitizeInput<T>(input: T): T {
  if (typeof input === 'string') {
    return input.trim() as T;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput) as T;
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized as T;
  }

  return input;
}

/**
 * Convert Zod schema to JSON Schema for MCP protocol
 */
export function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  // This is a simplified conversion - for production, use zodToJsonSchema library
  // For now, we'll create a basic structure

  // Helper to get JSON Schema type
  const getType = (zodType: z.ZodTypeAny): string => {
    if (zodType instanceof z.ZodString) return 'string';
    if (zodType instanceof z.ZodNumber) return 'number';
    if (zodType instanceof z.ZodBoolean) return 'boolean';
    if (zodType instanceof z.ZodObject) return 'object';
    if (zodType instanceof z.ZodArray) return 'array';
    return 'string';
  };

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    const shape = schema.shape as Record<string, z.ZodTypeAny>;

    for (const [key, value] of Object.entries(shape)) {
      const prop: Record<string, unknown> = {
        type: getType(value),
      };

      // Add description if available
      const zodValue = value as { description?: string };
      if (zodValue.description) {
        prop['description'] = zodValue.description;
      }

      // Check if optional
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }

      properties[key] = prop;
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return {
    type: 'object',
    properties: {},
  };
}
