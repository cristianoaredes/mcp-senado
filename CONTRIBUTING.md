# Contributing to MCP Senado Federal

Thank you for your interest in contributing to the MCP Senado Federal project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-senado.git
   cd mcp-senado
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/cristianoaredes/mcp-camara.git
   ```

## Development Setup

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the project
npm run build

# Run tests
npm test
```

### Development Scripts

```bash
# Development mode with watch
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run HTTP server
npm run dev:http

# Run Cloudflare Workers locally
npm run dev:workers
```

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch (base for features)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Workflow

1. **Create a feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** following the coding standards

3. **Write or update tests** for your changes

4. **Ensure all tests pass**:
   ```bash
   npm test
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Commit your changes** with clear, descriptive messages

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/core/validation.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in the `test/` directory matching the source structure
- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert
- Mock external dependencies appropriately

#### Test Structure

```typescript
describe('Feature Name', () => {
  describe('SubFeature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Test Coverage Goals

- Aim for **>80% overall coverage**
- Critical paths should have **100% coverage**
- All new features must include tests

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed (README, comments, etc.)

2. **Ensure your branch is up to date** with `develop`:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

3. **Push your branch** to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create a Pull Request** on GitHub:
   - Base: `cristianoaredes/mcp-camara:develop`
   - Head: `YOUR_USERNAME/mcp-senado:feature/my-new-feature`

5. **Fill out the PR template** with:
   - Clear description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

6. **Wait for review** and address any feedback

### Pull Request Guidelines

- **One feature/fix per PR** - Keep PRs focused and manageable
- **Write clear commit messages** - Follow conventional commits format
- **Update tests** - Ensure all tests pass
- **Update documentation** - Keep docs in sync with code
- **No merge commits** - Rebase instead of merge

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

**Examples:**
```
feat(tools): add new senate voting tool

Implements tool for retrieving detailed voting results
including individual senator votes and party positions.

Closes #123
```

```
fix(cache): resolve memory leak in LRU cache

The cache cleanup interval wasn't being cleared properly
on cache destruction, causing memory leaks.
```

## Coding Standards

### TypeScript

- Use **strict mode** TypeScript
- Define explicit types for public APIs
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` if type is truly unknown

### Code Style

- **Indentation**: 2 spaces
- **Line length**: Max 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing commas**: Use for multi-line structures

### Naming Conventions

- **Files**: kebab-case (`http-client.ts`)
- **Classes**: PascalCase (`HttpClient`)
- **Functions/Variables**: camelCase (`createHttpClient`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`HttpClientConfig`)
- **Types**: PascalCase (`ToolContext`)

### Code Organization

```typescript
// 1. Imports (external first, then internal)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createLogger } from './infrastructure/logger.js';

// 2. Type definitions
export interface MyConfig {
  // ...
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main code
export class MyClass {
  // ...
}

// 5. Helper functions
function helperFunction() {
  // ...
}
```

### Documentation

- Add JSDoc comments for all public APIs
- Include examples in comments for complex functions
- Document parameters, return types, and thrown errors

```typescript
/**
 * Creates an HTTP client for the Senado API
 *
 * @param config - Client configuration options
 * @param logger - Logger instance for request logging
 * @param circuitBreaker - Optional circuit breaker for fault tolerance
 * @returns Configured HTTP client instance
 *
 * @example
 * ```typescript
 * const client = createHttpClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 30000
 * }, logger);
 * ```
 */
export function createHttpClient(
  config: HttpClientConfig,
  logger: Logger,
  circuitBreaker?: CircuitBreaker
): HttpClient {
  // Implementation
}
```

## Project Structure

```
mcp-senado/
├── lib/                      # Source code
│   ├── adapters/            # Transport adapters (HTTP, Workers)
│   ├── bin/                 # CLI entry points
│   ├── config/              # Configuration management
│   ├── core/                # Core MCP server logic
│   ├── infrastructure/      # Infrastructure components
│   ├── tools/               # MCP tool implementations
│   ├── types/               # TypeScript type definitions
│   └── workers/             # Cloudflare Workers entry points
├── test/                     # Tests
│   ├── core/                # Core logic tests
│   ├── e2e/                 # End-to-end tests
│   ├── infrastructure/      # Infrastructure tests
│   ├── integration/         # Integration tests
│   └── tools/               # Tool tests
├── .github/                  # GitHub configuration
│   └── workflows/           # CI/CD workflows
├── build/                    # Compiled output (gitignored)
├── coverage/                 # Test coverage reports (gitignored)
└── node_modules/            # Dependencies (gitignored)
```

### Key Files

- **`lib/core/mcp-server.ts`** - Main MCP server implementation
- **`lib/core/tools.ts`** - Tool registry
- **`lib/types/index.ts`** - Central type definitions
- **`lib/config/config.ts`** - Configuration loader
- **`package.json`** - Project metadata and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`vitest.config.ts`** - Test configuration

## Adding New Tools

To add a new tool to the server:

1. **Create tool file** in `lib/tools/` (e.g., `my-new-tools.ts`)

2. **Define tool schema** using Zod:
   ```typescript
   import { z } from 'zod';

   const MyToolSchema = z.object({
     param1: z.string().describe('Description'),
     param2: z.number().optional().describe('Optional param'),
   });
   ```

3. **Implement tool handler**:
   ```typescript
   import { createTool } from '../core/tools.js';
   import type { ToolContext } from '../types/index.js';

   export const myNewTools = [
     createTool(
       'my_tool_name',
       'Tool description',
       MyToolSchema,
       async (args, context: ToolContext) => {
         // Validate input
         const validatedArgs = validateToolInput('my_tool_name', args, MyToolSchema);

         // Use context.httpClient, context.logger, etc.
         const response = await context.httpClient.get('/endpoint', validatedArgs);

         // Format and return result
         return {
           content: [{
             type: 'text',
             text: formatResult(response.data)
           }]
         };
       },
       'category_name'
     ),
   ];
   ```

4. **Register tools** in `lib/bin/mcp-senado.ts` and `lib/bin/mcp-senado-http.ts`:
   ```typescript
   import { myNewTools } from '../tools/my-new-tools.js';

   toolRegistry.registerMany(myNewTools);
   ```

5. **Write tests** in `test/tools/my-new-tools.test.ts`

6. **Update documentation** in README.md

## Getting Help

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Email**: Contact the maintainers for sensitive issues

## License

By contributing to MCP Senado Federal, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing! 🎉
