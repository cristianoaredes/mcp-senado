/**
 * Tool Registry
 *
 * Manages tool registration and invocation:
 * - Register tools with name, description, schema, handler
 * - Get tool by name
 * - List all tools
 * - Tool validation
 * - Category organization
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../types/index.js';
import { ToolNotFoundError } from './errors.js';

/**
 * Tool Registry class
 */
export class ToolRegistry {
  private readonly tools: Map<string, ToolDefinition>;
  private readonly toolsByCategory: Map<string, ToolDefinition[]>;

  constructor() {
    this.tools = new Map();
    this.toolsByCategory = new Map();
  }

  /**
   * Register a single tool
   */
  register(tool: ToolDefinition): void {
    // Validate tool definition
    this.validateToolDefinition(tool);

    // Check for duplicates
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    // Register tool
    this.tools.set(tool.name, tool);

    // Add to category
    if (!this.toolsByCategory.has(tool.category)) {
      this.toolsByCategory.set(tool.category, []);
    }
    this.toolsByCategory.get(tool.category)!.push(tool);
  }

  /**
   * Register multiple tools
   */
  registerMany(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolDefinition {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new ToolNotFoundError(name);
    }

    return tool;
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolDefinition[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.toolsByCategory.keys());
  }

  /**
   * Get tool count
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Get tool count by category
   */
  countByCategory(category: string): number {
    return this.toolsByCategory.get(category)?.length || 0;
  }

  /**
   * List all tool names
   */
  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Invoke tool with arguments
   */
  async invoke(
    name: string,
    args: unknown,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.get(name);

    try {
      return await tool.handler(args, context);
    } catch (error) {
      // Let errors bubble up - they'll be caught by the MCP server
      throw error;
    }
  }

  /**
   * Validate tool definition
   */
  private validateToolDefinition(tool: ToolDefinition): void {
    const errors: string[] = [];

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool name is required and must be a string');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool description is required and must be a string');
    }

    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      errors.push('Tool inputSchema is required and must be an object');
    }

    if (!tool.handler || typeof tool.handler !== 'function') {
      errors.push('Tool handler is required and must be a function');
    }

    if (!tool.category || typeof tool.category !== 'string') {
      errors.push('Tool category is required and must be a string');
    }

    if (errors.length > 0) {
      throw new Error(
        `Invalid tool definition for ${tool.name || 'unknown'}:\n${errors.join('\n')}`
      );
    }
  }

  /**
   * Get tool summary for logging/debugging
   */
  getSummary(): string {
    const categories = this.getCategories();
    let summary = `Tool Registry Summary:\n`;
    summary += `Total tools: ${this.count()}\n\n`;

    for (const category of categories) {
      const tools = this.getByCategory(category);
      summary += `${category} (${tools.length}):\n`;
      for (const tool of tools) {
        summary += `  - ${tool.name}: ${tool.description}\n`;
      }
      summary += '\n';
    }

    return summary;
  }

  /**
   * Clear all tools (for testing)
   */
  clear(): void {
    this.tools.clear();
    this.toolsByCategory.clear();
  }
}

/**
 * Create a new tool registry
 */
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry();
}
