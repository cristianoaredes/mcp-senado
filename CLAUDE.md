# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

**MCP Senado Federal** é um servidor MCP (Model Context Protocol) escrito em TypeScript que conecta assistentes de IA à API de Dados Abertos do Senado Federal do Brasil. O projeto oferece 56 ferramentas organizadas em 7 categorias para acesso a dados legislativos completos.

### Características Principais
- **56 ferramentas MCP** organizadas por categoria (senadores, propostas, votações, comissões, etc.)
- **4 modos de deployment**: stdio (MCP padrão), HTTP/REST, Docker, Cloudflare Workers com Durable Objects
- **Infraestrutura resiliente**: Cache LRU, Circuit Breaker, Rate Limiting, Retry com backoff
- **TypeScript strict mode**: Type-safe completo com inferência de tipos
- **211 testes** com 73% de cobertura (Vitest)

## Comandos de Desenvolvimento

### Instalação e Build
```bash
# Instalar dependências
npm install

# Build TypeScript
npm run build

# Limpar build anterior
npm run clean
```

### Desenvolvimento Local
```bash
# Modo stdio (MCP padrão - para integração com Claude Desktop)
npm run dev

# Modo HTTP (REST API em localhost:3000)
npm run dev:http

# Modo Cloudflare Workers (com Durable Objects)
npm run dev:workers
```

### Testes
```bash
# Executar todos os testes
npm test

# Modo watch (desenvolvimento)
npm test:watch

# Coverage report
npm test:coverage

# Smoke test (validação rápida)
npm run smoke
```

### Linting e Validação
```bash
# Type checking (sem emitir código)
npm run lint
```

### Deploy
```bash
# Deploy Cloudflare Workers (development)
npm run deploy:workers

# Deploy staging
npm run deploy:workers:staging

# Deploy production
npm run deploy:workers:production
```

**IMPORTANTE**: Sempre executar `npm run build` antes de `deploy:workers` para garantir que o código TypeScript foi compilado.

## Arquitetura de Alto Nível

### Camadas da Aplicação

O projeto segue arquitetura em camadas bem definida:

#### 1. **Core Layer** (`lib/core/`)
- `mcp-server.ts`: Servidor MCP principal que estende o SDK do MCP
- `tools.ts`: Registry de ferramentas com validação e invocação
- `validation.ts`: Schemas Zod para validação de entrada/saída
- `errors.ts`: Sistema de tratamento de erros customizado

#### 2. **Infrastructure Layer** (`lib/infrastructure/`)
- `http-client.ts`: Cliente HTTP com parsing XML→JSON (API do Senado retorna XML)
- `cache.ts`: Cache LRU em memória com TTL
- `circuit-breaker.ts`: Pattern de Circuit Breaker para proteção contra falhas
- `rate-limiter.ts`: Token bucket para controle de requisições
- `logger.ts`: Sistema de logging estruturado

#### 3. **Tools Layer** (`lib/tools/`)
Cada arquivo implementa ferramentas de uma categoria:
- `reference-tools.ts`: Dados de referência (legislaturas, tipos, UFs)
- `senator-tools.ts`: 13 ferramentas sobre senadores
- `proposal-tools.ts`: 12 ferramentas sobre proposições legislativas
- `voting-tools.ts`: 5 ferramentas sobre votações
- `committee-tools.ts`: 5 ferramentas sobre comissões
- `party-tools.ts`: 5 ferramentas sobre partidos
- `session-tools.ts`: 6 ferramentas sobre sessões plenárias

#### 4. **Adapters Layer** (`lib/adapters/`)
- `http.ts`: Adaptador HTTP/REST com Express 5
- `workers.ts`: Adaptador Cloudflare Workers

#### 5. **Durable Objects** (`lib/durable-objects/`)
Componentes de estado persistente para Cloudflare Workers:
- `cache-do.ts`: Cache distribuído entre todos os Workers
- `rate-limiter-do.ts`: Rate limiting global consistente
- `circuit-breaker-do.ts`: Circuit breaker compartilhado
- `metrics-do.ts`: Métricas agregadas de todas as requisições

### Sistema de Ferramentas MCP

**Padrão de Implementação:**

Todas as ferramentas seguem o mesmo padrão:

```typescript
{
  name: 'nome_da_ferramenta',
  description: 'Descrição em português',
  category: 'Categoria',
  inputSchema: zodSchema,  // Validação com Zod
  handler: async (args, context) => {
    // 1. Validar argumentos
    // 2. Construir cache key
    // 3. Verificar cache
    // 4. Chamar API do Senado via httpClient
    // 5. Parsear XML → JSON
    // 6. Transformar dados
    // 7. Salvar em cache
    // 8. Retornar ToolResult
  }
}
```

**ToolContext:**
Todas as ferramentas recebem um contexto com:
- `httpClient`: Cliente HTTP configurado
- `cache`: Interface de cache
- `config`: Configuração do servidor
- `logger`: Logger estruturado

### Cloudflare Workers + Durable Objects

**Arquitetura Distribuída:**

O deploy em Cloudflare Workers usa **4 Durable Objects** para estado persistente:

1. **CacheDurableObject**: Cache LRU compartilhado globalmente
   - Evita requisições repetidas à API do Senado
   - TTL configurável (padrão: 5 minutos)

2. **RateLimiterDurableObject**: Rate limiting consistente
   - Token bucket distribuído
   - Previne abuso e respeita limites da API

3. **CircuitBreakerDurableObject**: Proteção contra falhas
   - Estados: CLOSED, OPEN, HALF_OPEN
   - Previne cascata de erros quando API falha

4. **MetricsDurableObject**: Analytics em tempo real
   - Agregação de métricas de todos os Workers
   - Observabilidade centralizada

**Benefício**: Estado consistente entre 300+ data centers globalmente.

### Parsing XML → JSON

**Detalhe importante**: A API do Senado Federal retorna XML, não JSON. O cliente HTTP (`SenadoHttpClient`) usa `fast-xml-parser` para converter automaticamente:

```typescript
// Configuração do parser XML
{
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true
}
```

Ao trabalhar com respostas da API, espere estruturas como:
```typescript
{
  '@_atributo': 'valor',
  '#text': 'conteúdo',
  elemento: { ... }
}
```

## Configuração

### Hierarquia de Configuração

1. **Variáveis de ambiente** (.env) - maior prioridade
2. **.mcprc.json** (arquivo opcional na raiz)
3. **Valores padrão** em `config.ts`

### Variáveis de Ambiente Essenciais

```bash
# API do Senado (obrigatório)
SENADO_API_BASE_URL=https://legis.senado.leg.br/dadosabertos
SENADO_API_TIMEOUT=30000
SENADO_API_MAX_RETRIES=3

# Modo HTTP (opcional)
HTTP_PORT=3000
HTTP_HOST=0.0.0.0
HTTP_CORS_ORIGIN=*

# Cache (performance)
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300000  # 5 minutos em ms
MCP_CACHE_MAX_SIZE=1000

# Rate Limiting (proteção)
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_TOKENS=30
MCP_RATE_LIMIT_INTERVAL=60000  # 1 minuto

# Circuit Breaker (resiliência)
MCP_CIRCUIT_BREAKER_ENABLED=true
MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
MCP_CIRCUIT_BREAKER_TIMEOUT=60000  # 1 minuto

# Logging
MCP_LOG_LEVEL=info  # debug | info | warn | error
MCP_LOG_FORMAT=json  # json | text
MCP_LOG_MASK_PII=true  # LGPD compliance
```

## Estrutura de Testes

```
test/
├── core/              # Testes do core MCP (server, tools, validation)
├── infrastructure/    # Testes de cache, circuit breaker, rate limiter, HTTP client
├── integration/       # Testes de integração com API real do Senado
└── e2e/              # Testes end-to-end do servidor completo
```

### Executar Testes Específicos

```bash
# Testes de uma categoria específica
npx vitest run test/core

# Teste de um arquivo específico
npx vitest run test/infrastructure/cache.test.ts

# Modo watch em arquivo específico
npx vitest watch test/core/tools.test.ts
```

### Marcadores de Teste

Os testes usam marcadores para categorização:
- `unit`: Testes unitários isolados
- `integration`: Testes que fazem requisições à API real
- `slow`: Testes que podem demorar
- `network`: Testes que dependem de rede

## Padrões de Código

### TypeScript Strict Mode

O projeto usa **todas** as flags strict do TypeScript:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

**Ao adicionar código:**
- Sempre use tipos explícitos para parâmetros
- Nunca use `any` (use `unknown` + type guards)
- Trate possíveis `undefined` com optional chaining
- Use type guards antes de acessar propriedades

### Tratamento de Erros

Use as classes de erro customizadas em `lib/core/errors.ts`:

```typescript
import {
  ToolNotFoundError,
  ValidationError,
  ApiError,
  CacheError,
  RateLimitError,
  CircuitBreakerOpenError
} from './core/errors.js';

// Exemplo
if (!tool) {
  throw new ToolNotFoundError(toolName);
}
```

Erros são automaticamente convertidos para `ToolResult` pelo servidor MCP.

### Logging Estruturado

```typescript
logger.debug('Message', { context: 'data' });
logger.info('Message', { context: 'data' });
logger.warn('Message', { context: 'data' });
logger.error('Message', error, { context: 'data' });
```

**PII Masking**: Quando `MCP_LOG_MASK_PII=true`, dados pessoais são automaticamente mascarados nos logs (LGPD compliance).

## Binários CLI

O projeto expõe 2 binários:

1. **mcp-senado**: Modo stdio (MCP padrão)
   ```bash
   npx @aredes.me/mcp-senado
   ```

2. **mcp-senado-http**: Servidor HTTP/REST
   ```bash
   npx @aredes.me/mcp-senado-http
   ```

## Endpoints HTTP (quando em modo HTTP)

```
GET  /health                    # Health check
POST /mcp                       # Protocolo MCP via JSON-RPC
GET  /sse                       # Server-Sent Events
GET  /info                      # Informações do servidor
GET  /api/tools                 # Lista todas as ferramentas
GET  /api/tools/:name           # Detalhes de ferramenta
POST /api/tools/:name           # Executa ferramenta
GET  /api/categories            # Lista categorias
GET  /api/tools/category/:cat   # Ferramentas por categoria
```

## Desenvolvimento de Novas Ferramentas

Para adicionar uma nova ferramenta:

1. **Definir schema Zod** em `lib/core/validation.ts`
2. **Implementar handler** no arquivo de tools apropriado (ex: `senator-tools.ts`)
3. **Registrar** a ferramenta no registry
4. **Adicionar testes** em `test/integration/` ou `test/core/`

Exemplo de estrutura:

```typescript
export const minhaNovaFerramenta: ToolDefinition = {
  name: 'minha_ferramenta',
  description: 'Descrição em português',
  category: 'Categoria',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Descrição' }
    },
    required: ['param1']
  },
  handler: async (args: unknown, context: ToolContext): Promise<ToolResult> => {
    // Validar args com Zod
    // Verificar cache
    // Fazer requisição HTTP
    // Retornar resultado
  }
};
```

## Observações Importantes

### API do Senado Federal
- **Formato**: XML (convertido para JSON automaticamente)
- **Rate Limit**: Não documentado oficialmente, usar rate limiting preventivo
- **Disponibilidade**: Pode ter instabilidade ocasional (daí a importância do circuit breaker)
- **Documentação**: https://legis.senado.leg.br/dadosabertos/

### Dependências Críticas
- `@modelcontextprotocol/sdk`: SDK oficial do MCP
- `fast-xml-parser`: Parser XML (específico para API do Senado)
- `zod`: Validação de schemas
- `express`: Servidor HTTP (v5.x)

### Multi-Stage Build (Docker)
O `Dockerfile` usa build multi-stage para otimização:
- Stage 1: Build TypeScript
- Stage 2: Runtime com Alpine Linux (~150MB final)

### Wrangler.toml
**IMPORTANTE**: Após modificar Durable Objects, sempre criar nova migration tag em `wrangler.toml`:

```toml
[[migrations]]
tag = "v2"  # Incrementar versão
renamed_classes = [...]
# ou
new_classes = [...]
```

## Próximos Passos Comuns

- **Adicionar nova categoria de ferramentas**: Criar arquivo em `lib/tools/`, definir schemas em `validation.ts`
- **Melhorar cache**: Ajustar TTL em `.env` ou implementar invalidação seletiva
- **Deploy production**: Configurar `wrangler.toml` com route customizada
- **Integração CI/CD**: Workflows em `.github/workflows/` já configurados
