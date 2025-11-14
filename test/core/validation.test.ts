import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  PaginationSchema,
  DateRangeSchema,
  CodeSchema,
  LegislatureSchema,
  UFSchema,
  ListSenatorsSchema,
  SenatorDetailsSchema,
  validateToolInput,
  zodToJsonSchema,
} from '../../lib/core/validation.js';
import { ValidationError } from '../../lib/core/errors.js';

describe('Common Schemas', () => {
  describe('PaginationSchema', () => {
    it('should validate valid pagination', () => {
      const valid = {
        pagina: 1,
        itens: 10,
      };
      expect(() => PaginationSchema.parse(valid)).not.toThrow();
    });

    it('should allow optional pagination', () => {
      const valid = {};
      expect(() => PaginationSchema.parse(valid)).not.toThrow();
    });

    it('should reject negative page numbers', () => {
      const invalid = { pagina: -1 };
      expect(() => PaginationSchema.parse(invalid)).toThrow();
    });

    it('should reject zero page numbers', () => {
      const invalid = { pagina: 0 };
      expect(() => PaginationSchema.parse(invalid)).toThrow();
    });

    it('should reject items > 100', () => {
      const invalid = { itens: 101 };
      expect(() => PaginationSchema.parse(invalid)).toThrow();
    });

    it('should reject items < 1', () => {
      const invalid = { itens: 0 };
      expect(() => PaginationSchema.parse(invalid)).toThrow();
    });

    it('should allow items = 100', () => {
      const valid = { itens: 100 };
      expect(() => PaginationSchema.parse(valid)).not.toThrow();
    });
  });

  describe('DateRangeSchema', () => {
    it('should validate valid date range', () => {
      const valid = {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };
      expect(() => DateRangeSchema.parse(valid)).not.toThrow();
    });

    it('should allow optional dates', () => {
      const valid = {};
      expect(() => DateRangeSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const invalid = { dataInicio: '01/01/2024' };
      expect(() => DateRangeSchema.parse(invalid)).toThrow();
    });

    it('should reject partial dates', () => {
      const invalid = { dataInicio: '2024-01' };
      expect(() => DateRangeSchema.parse(invalid)).toThrow();
    });

    it('should reject non-date strings', () => {
      const invalid = { dataInicio: 'not-a-date' };
      expect(() => DateRangeSchema.parse(invalid)).toThrow();
    });
  });

  describe('CodeSchema', () => {
    it('should validate positive integer', () => {
      expect(() => CodeSchema.parse(123)).not.toThrow();
    });

    it('should reject zero', () => {
      expect(() => CodeSchema.parse(0)).toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => CodeSchema.parse(-1)).toThrow();
    });

    it('should reject decimals', () => {
      expect(() => CodeSchema.parse(1.5)).toThrow();
    });

    it('should reject strings', () => {
      expect(() => CodeSchema.parse('123')).toThrow();
    });
  });

  describe('LegislatureSchema', () => {
    it('should validate positive integer', () => {
      expect(() => LegislatureSchema.parse(57)).not.toThrow();
    });

    it('should reject zero', () => {
      expect(() => LegislatureSchema.parse(0)).toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => LegislatureSchema.parse(-1)).toThrow();
    });
  });

  describe('UFSchema', () => {
    it('should validate valid UF codes', () => {
      const validUFs = ['SP', 'RJ', 'MG', 'RS', 'BA'];
      validUFs.forEach(uf => {
        expect(() => UFSchema.parse(uf)).not.toThrow();
      });
    });

    it('should convert lowercase to uppercase', () => {
      const result = UFSchema.parse('sp');
      expect(result).toBe('SP');
    });

    it('should reject invalid length', () => {
      expect(() => UFSchema.parse('S')).toThrow();
      expect(() => UFSchema.parse('SPP')).toThrow();
    });

    // Note: UFSchema doesn't validate against actual UF codes, just length
    it('should accept two-character strings', () => {
      expect(() => UFSchema.parse('XY')).not.toThrow();
    });
  });
});

describe('Senator Tool Schemas', () => {
  describe('ListSenatorsSchema', () => {
    it('should validate complete input', () => {
      const valid = {
        nome: 'João',
        partido: 'PT',
        uf: 'SP',
        legislatura: 57,
        pagina: 1,
        itens: 20,
      };
      expect(() => ListSenatorsSchema.parse(valid)).not.toThrow();
    });

    it('should allow empty input', () => {
      const valid = {};
      expect(() => ListSenatorsSchema.parse(valid)).not.toThrow();
    });

    it('should validate partial input', () => {
      const valid = { uf: 'RJ', pagina: 2 };
      expect(() => ListSenatorsSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid nome length', () => {
      const invalid = { nome: 'a'.repeat(101) };
      expect(() => ListSenatorsSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid partido length', () => {
      const invalid = { partido: 'a'.repeat(21) };
      expect(() => ListSenatorsSchema.parse(invalid)).toThrow();
    });

    // Note: UFSchema doesn't validate against actual UF codes, just length and format
    it('should accept two-character UF codes', () => {
      const valid = { uf: 'XY' };
      expect(() => ListSenatorsSchema.parse(valid)).not.toThrow();
    });
  });

  describe('SenatorDetailsSchema', () => {
    it('should validate valid codigo', () => {
      const valid = { codigo: 5012 };
      expect(() => SenatorDetailsSchema.parse(valid)).not.toThrow();
    });

    it('should require codigo field', () => {
      const invalid = {};
      expect(() => SenatorDetailsSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid codigo', () => {
      const invalid = { codigo: -1 };
      expect(() => SenatorDetailsSchema.parse(invalid)).toThrow();
    });
  });
});

describe('validateToolInput()', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0),
    email: z.string().email().optional(),
  });

  it('should validate and return valid input', () => {
    const input = { name: 'John', age: 30 };
    const result = validateToolInput(testSchema, input, 'testTool');
    expect(result).toEqual(input);
  });

  it('should sanitize string input (trim whitespace)', () => {
    const input = { name: '  John  ', age: 30 };
    const result = validateToolInput(testSchema, input, 'testTool');
    expect(result.name).toBe('John');
  });

  it('should handle nested objects', () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string(),
      }),
    });
    const input = { user: { name: '  Alice  ' } };
    const result = validateToolInput(nestedSchema, input, 'testTool');
    expect(result.user.name).toBe('Alice');
  });

  it('should throw ValidationError for invalid input', () => {
    const input = { name: '', age: 30 }; // Empty name violates min(1)

    expect(() => validateToolInput(testSchema, input, 'testTool')).toThrow(
      ValidationError
    );
  });

  it('should include tool name in error message', () => {
    const input = { name: '', age: 30 };

    try {
      validateToolInput(testSchema, input, 'myTestTool');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.message).toContain('myTestTool');
    }
  });

  it('should include field name in error', () => {
    const input = { name: 'John', age: -5 }; // Negative age

    try {
      validateToolInput(testSchema, input, 'testTool');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.field).toBe('age');
    }
  });

  it('should handle missing required fields', () => {
    const input = { age: 30 }; // Missing name

    expect(() => validateToolInput(testSchema, input, 'testTool')).toThrow(
      ValidationError
    );
  });

  it('should handle type mismatches', () => {
    const input = { name: 'John', age: '30' }; // age should be number

    expect(() => validateToolInput(testSchema, input, 'testTool')).toThrow(
      ValidationError
    );
  });

  it('should validate optional fields', () => {
    const input = { name: 'John', age: 30, email: 'john@example.com' };
    const result = validateToolInput(testSchema, input, 'testTool');
    expect(result.email).toBe('john@example.com');
  });

  it('should reject invalid optional fields', () => {
    const input = { name: 'John', age: 30, email: 'not-an-email' };

    expect(() => validateToolInput(testSchema, input, 'testTool')).toThrow(
      ValidationError
    );
  });
});

describe('sanitizeInput()', () => {
  // Testing through validateToolInput since sanitizeInput is private

  it('should trim strings', () => {
    const schema = z.object({ name: z.string() });
    const input = { name: '  test  ' };
    const result = validateToolInput(schema, input, 'test');
    expect(result.name).toBe('test');
  });

  it('should sanitize array elements', () => {
    const schema = z.object({ names: z.array(z.string()) });
    const input = { names: ['  alice  ', '  bob  '] };
    const result = validateToolInput(schema, input, 'test');
    expect(result.names).toEqual(['alice', 'bob']);
  });

  it('should sanitize nested objects', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        address: z.object({
          city: z.string(),
        }),
      }),
    });
    const input = {
      user: {
        name: '  John  ',
        address: {
          city: '  NYC  ',
        },
      },
    };
    const result = validateToolInput(schema, input, 'test');
    expect(result.user.name).toBe('John');
    expect(result.user.address.city).toBe('NYC');
  });

  it('should not modify numbers', () => {
    const schema = z.object({ age: z.number() });
    const input = { age: 30 };
    const result = validateToolInput(schema, input, 'test');
    expect(result.age).toBe(30);
  });

  it('should not modify booleans', () => {
    const schema = z.object({ active: z.boolean() });
    const input = { active: true };
    const result = validateToolInput(schema, input, 'test');
    expect(result.active).toBe(true);
  });
});

describe('zodToJsonSchema()', () => {
  it('should convert simple object schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const jsonSchema = zodToJsonSchema(schema);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toBeDefined();
    expect((jsonSchema.properties as Record<string, any>).name.type).toBe('string');
    expect((jsonSchema.properties as Record<string, any>).age.type).toBe('number');
  });

  it('should include descriptions', () => {
    const schema = z.object({
      name: z.string().describe('User name'),
    });

    const jsonSchema = zodToJsonSchema(schema);
    const properties = jsonSchema.properties as Record<string, any>;
    expect(properties.name.description).toBe('User name');
  });

  it('should mark required fields', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });

    const jsonSchema = zodToJsonSchema(schema);
    const required = jsonSchema.required as string[];

    expect(required).toContain('required');
    expect(required).not.toContain('optional');
  });

  it('should handle boolean types', () => {
    const schema = z.object({
      active: z.boolean(),
    });

    const jsonSchema = zodToJsonSchema(schema);
    const properties = jsonSchema.properties as Record<string, any>;
    expect(properties.active.type).toBe('boolean');
  });

  it('should handle array types', () => {
    const schema = z.object({
      tags: z.array(z.string()),
    });

    const jsonSchema = zodToJsonSchema(schema);
    const properties = jsonSchema.properties as Record<string, any>;
    expect(properties.tags.type).toBe('array');
  });

  it('should handle nested objects', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
      }),
    });

    const jsonSchema = zodToJsonSchema(schema);
    const properties = jsonSchema.properties as Record<string, any>;
    expect(properties.user.type).toBe('object');
  });

  it('should handle all optional fields', () => {
    const schema = z.object({
      field1: z.string().optional(),
      field2: z.number().optional(),
    });

    const jsonSchema = zodToJsonSchema(schema);
    expect(jsonSchema.required).toBeUndefined();
  });

  it('should return basic schema for non-object types', () => {
    const schema = z.string();
    const jsonSchema = zodToJsonSchema(schema);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toEqual({});
  });
});

describe('Integration tests', () => {
  it('should validate ListSenatorsSchema with real-world input', () => {
    const input = {
      nome: '  João Silva  ',
      uf: 'sp',
      pagina: 1,
      itens: 25,
    };

    const result = validateToolInput(ListSenatorsSchema, input, 'listar_senadores');

    expect(result.nome).toBe('João Silva'); // Trimmed
    expect(result.uf).toBe('SP'); // Uppercase
    expect(result.pagina).toBe(1);
    expect(result.itens).toBe(25);
  });

  it('should validate SenatorDetailsSchema with real-world input', () => {
    const input = { codigo: 5012 };

    const result = validateToolInput(SenatorDetailsSchema, input, 'detalhes_senador');

    expect(result.codigo).toBe(5012);
  });

  it('should convert ListSenatorsSchema to JSON Schema', () => {
    const jsonSchema = zodToJsonSchema(ListSenatorsSchema);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toBeDefined();

    const properties = jsonSchema.properties as Record<string, any>;
    expect(properties.nome).toBeDefined();
    expect(properties.uf).toBeDefined();
    expect(properties.pagina).toBeDefined();
    expect(properties.itens).toBeDefined();
  });
});
