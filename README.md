# MCP Senado Federal 🇧🇷

> **Servidor MCP para API de Dados Abertos do Senado Federal Brasileiro**
> Conecte assistentes de IA como Claude, Cursor, Windsurf e Continue.dev aos dados legislativos oficiais do Congresso Nacional

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/cristianoaredes/mcp-senado/actions/workflows/ci.yml/badge.svg)](https://github.com/cristianoaredes/mcp-senado/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-211%20passing-brightgreen.svg)](https://github.com/cristianoaredes/mcp-senado)
[![Coverage](https://img.shields.io/badge/Coverage-73%25-yellow.svg)](https://github.com/cristianoaredes/mcp-senado)
[![NPM](https://img.shields.io/badge/NPM-@aredes.me/mcp--senado-red.svg)](https://www.npmjs.com/package/@aredes.me/mcp-senado)

[English](./README.en.md) | **Português** | [Documentação Completa](#-documentação) | [Contribuir](./CONTRIBUTING.md)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Recursos Principais](#-recursos-principais)
- [Instalação](#-instalação)
- [Início Rápido](#-início-rápido)
- [Ferramentas Disponíveis](#-ferramentas-disponíveis)
- [Modos de Implantação](#-modos-de-implantação)
- [Configuração](#-configuração)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

**MCP Senado Federal** é um servidor MCP (Model Context Protocol) de código aberto que conecta assistentes de inteligência artificial à **API de Dados Abertos do Senado Federal do Brasil**. Desenvolvido com TypeScript, oferece acesso programático a dados legislativos completos, incluindo informações sobre senadores, propostas legislativas, votações, comissões, partidos e sessões plenárias.

### Por que usar?

- 🤖 **Integração com IA**: Use ChatGPT, Claude, Cursor, Windsurf para consultar dados do Senado
- 📊 **Dados Oficiais**: Acesso direto à fonte oficial de dados abertos do Senado Federal
- 🚀 **Pronto para Produção**: Circuit breaker, rate limiting, cache e monitoramento incluídos
- 🔒 **Seguro e Confiável**: Validação de entrada, conformidade com LGPD, tratamento robusto de erros
- 🌍 **Deploy Global**: Suporte para Docker, Cloudflare Workers (edge computing) e HTTP/REST
- 📚 **Bem Documentado**: Documentação completa em português e inglês

### Casos de Uso

- **Jornalismo de Dados**: Análise automatizada de votações e propostas legislativas
- **Pesquisa Acadêmica**: Estudos sobre comportamento parlamentar e produção legislativa
- **Transparência Pública**: Ferramentas de acompanhamento da atividade legislativa
- **Aplicações Cívicas**: Chatbots e assistentes virtuais para educação política
- **Análise Política**: Dashboards e relatórios sobre o Congresso Nacional

---

## ✨ Recursos Principais

### 🛠️ 56 Ferramentas em 7 Categorias

| Categoria | Ferramentas | Descrição |
|-----------|-------------|-----------|
| **Dados de Referência** | 10 ferramentas | Legislaturas, tipos de proposta, estados, comissões |
| **Senadores** | 13 ferramentas | Busca, biografia, votações, propostas, discursos |
| **Propostas Legislativas** | 12 ferramentas | Pesquisa, detalhes, votações, tramitação, textos |
| **Votações** | 5 ferramentas | Sessões de votação, resultados, votos individuais |
| **Comissões** | 5 ferramentas | Listagem, membros, reuniões, pautas |
| **Partidos** | 5 ferramentas | Partidos, blocos, lideranças |
| **Sessões Plenárias** | 6 ferramentas | Calendário, atas, discursos, resultados |

### 🚀 Características Técnicas

- ⚡ **Alto Desempenho**: Cache em memória com LRU, otimização de requisições
- 🛡️ **Resiliência**: Circuit breaker para proteção contra falhas da API
- 📊 **Monitoramento**: Logs estruturados, métricas, health checks
- 🔄 **Rate Limiting**: Token bucket para controle de taxa de requisições
- 🎯 **TypeScript Strict**: Type-safe com inferência de tipos completa
- ✅ **Testado**: 211 testes (73% de cobertura), incluindo E2E
- 🐳 **Containerizado**: Imagem Docker otimizada multi-stage (~150MB)
- ⚡ **Edge Computing**: Deploy em Cloudflare Workers (300+ data centers)

### 🔐 Segurança e Conformidade

- ✅ Validação rigorosa de entrada com Zod schemas
- ✅ Sanitização automática de dados
- ✅ Mascaramento de PII (Personally Identifiable Information)
- ✅ Conformidade com LGPD (Lei Geral de Proteção de Dados)
- ✅ Autenticação opcional por token
- ✅ CORS configurável
- ✅ Rate limiting para prevenir abuso

---

## 📦 Instalação

### Via NPM (Recomendado)

```bash
# Instalação global
npm install -g @aredes.me/mcp-senado

# Ou executar diretamente
npx @aredes.me/mcp-senado
```

### Via Git (Desenvolvimento)

```bash
git clone https://github.com/cristianoaredes/mcp-senado.git
cd mcp-senado
npm install
npm run build
```

### Requisitos

- **Node.js** 18.x ou superior
- **npm** 9.x ou superior
- **Memória**: Mínimo 512MB RAM
- **Sistema Operacional**: Linux, macOS, Windows (WSL2)

---

## 🚀 Início Rápido

### Claude Desktop

Adicione ao arquivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "senado-federal": {
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"],
      "env": {
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

**Localização do arquivo de configuração:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Cursor / Windsurf

Adicione às configurações MCP do editor:

```json
{
  "mcpServers": {
    "senado-federal": {
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"]
    }
  }
}
```

### Continue.dev

Adicione ao `config.json`:

```json
{
  "mcpServers": [
    {
      "name": "senado-federal",
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"]
    }
  ]
}
```

### Testando a Integração

Após configurar, pergunte ao seu assistente de IA:

```
"Liste os senadores do estado de São Paulo"
"Quais foram as últimas votações no Senado?"
"Mostre propostas sobre educação tramitando no Senado"
```

---

## 🛠️ Ferramentas Disponíveis

### 📚 Dados de Referência (10 ferramentas)

Acesso a dados fundamentais do sistema legislativo:

- `ufs_listar` - Lista todos os estados brasileiros (UFs)
- `legislaturas_listar` - Lista legislaturas do Senado Federal
- `tipos_materia_listar` - Lista tipos de proposições legislativas
- `situacoes_materia_listar` - Lista situações de tramitação
- `tipos_comissao_listar` - Lista tipos de comissões
- `tipos_autor_listar` - Lista tipos de autores
- `tipos_sessao_listar` - Lista tipos de sessões
- `tipos_votacao_listar` - Lista tipos de votações
- `tipos_documento_listar` - Lista tipos de documentos
- `assuntos_listar` - Lista classificações temáticas

### 👥 Senadores (13 ferramentas)

Informações completas sobre parlamentares:

- `senadores_listar` - Busca senadores com filtros (nome, partido, UF, legislatura)
- `senador_detalhes` - Detalhes completos de um senador específico
- `senador_historico` - Histórico parlamentar e mandatos anteriores
- `senador_votacoes` - Votações de um senador com filtros
- `senador_materias` - Propostas de autoria do senador
- `senador_discursos` - Discursos proferidos pelo senador
- `senador_licencas` - Licenças e afastamentos
- `senador_comissoes` - Participação em comissões
- `senador_liderancas` - Cargos de liderança ocupados
- `senador_filiacao` - Histórico de filiação partidária
- `senador_profissoes` - Profissões declaradas
- `senador_apartes` - Apartes realizados
- `senador_relatorias` - Relatorias de proposições

### 📜 Propostas Legislativas (12 ferramentas)

Acesso completo ao processo legislativo:

- `materias_pesquisar` - Busca avançada de proposições
- `materia_detalhes` - Informações detalhadas da proposição
- `materia_texto` - Texto integral da proposição
- `materia_votacoes` - Votações relacionadas
- `materia_tramitacao` - Histórico de tramitação
- `materia_autores` - Autores e coautores
- `materia_relacionadas` - Proposições relacionadas
- `materia_emendas` - Emendas apresentadas
- `materia_pareceres` - Pareceres emitidos
- `materia_notas_tecnicas` - Notas técnicas
- `materia_audiencias` - Audiências públicas relacionadas
- `materia_documentos` - Documentos anexos

### 🗳️ Votações (5 ferramentas)

Resultados de votações nominais e simbólicas:

- `votacoes_listar` - Lista votações com filtros
- `votacao_detalhes` - Detalhes de votação específica
- `votacao_votos` - Votos individuais dos senadores
- `votacao_orientacoes` - Orientações de bancadas
- `votacao_resumo` - Resumo estatístico da votação

### 🏛️ Comissões (5 ferramentas)

Informações sobre comissões parlamentares:

- `comissoes_listar` - Lista todas as comissões (permanentes e temporárias)
- `comissao_detalhes` - Detalhes de comissão específica
- `comissao_membros` - Composição da comissão
- `comissao_reunioes` - Calendário de reuniões
- `comissao_materias` - Propostas em análise

### 🎭 Partidos (5 ferramentas)

Dados sobre partidos e blocos parlamentares:

- `partidos_listar` - Lista partidos e blocos
- `partido_detalhes` - Informações do partido
- `partido_membros` - Senadores filiados
- `partido_liderancas` - Lideranças partidárias
- `blocos_listar` - Blocos parlamentares e coligações

### 📅 Sessões Plenárias (6 ferramentas)

Acompanhamento de sessões do plenário:

- `sessoes_listar` - Calendário de sessões
- `sessao_detalhes` - Detalhes de sessão específica
- `sessao_votacoes` - Votações da sessão
- `sessao_discursos` - Discursos proferidos
- `sessao_ordem_dia` - Ordem do dia
- `sessao_expediente` - Expediente da sessão

---

## 🌐 Modos de Implantação

### 1️⃣ Modo stdio (Padrão MCP)

Protocolo nativo para assistentes de IA:

```bash
# Via npx
npx @aredes.me/mcp-senado

# Via instalação global
mcp-senado

# Via código fonte
npm run dev
```

**Uso**: Integração direta com Claude Desktop, Cursor, Windsurf, Continue.dev

### 2️⃣ Modo HTTP/REST API

Servidor HTTP standalone para aplicações web:

```bash
# Desenvolvimento
npm run dev:http

# Produção
npm run start:http

# Porta personalizada
HTTP_PORT=8080 npm run start:http
```

**Endpoints disponíveis:**

```bash
GET  /health                    # Health check
GET  /info                      # Informações do servidor
GET  /api/tools                 # Lista todas as ferramentas
GET  /api/tools/:name           # Detalhes de ferramenta
POST /api/tools/:name           # Executa ferramenta
GET  /api/categories            # Lista categorias
GET  /api/tools/category/:cat   # Ferramentas por categoria
```

**Exemplo de uso:**

```bash
# Listar senadores de SP
curl -X POST http://localhost:3000/api/tools/senadores_listar \
  -H "Content-Type: application/json" \
  -d '{"uf": "SP"}'

# Health check
curl http://localhost:3000/health
```

**Autenticação (opcional):**

```bash
HTTP_AUTH_ENABLED=true \
HTTP_AUTH_TOKEN=seu-token-secreto \
npm run start:http

# Requisição autenticada
curl -H "Authorization: Bearer seu-token-secreto" \
  http://localhost:3000/api/tools
```

### 3️⃣ Modo Docker

Deploy containerizado com isolamento completo:

**Docker Compose (Recomendado):**

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

**Docker manual:**

```bash
# Build
docker build -t mcp-senado .

# Run
docker run -d \
  --name mcp-senado \
  -p 3000:3000 \
  -e HTTP_PORT=3000 \
  -e MCP_LOG_LEVEL=info \
  mcp-senado:latest

# Logs
docker logs -f mcp-senado
```

**Características:**
- 🐳 Imagem Alpine Linux (~150MB)
- 🔒 Execução como usuário não-root
- 🏥 Health check integrado
- 📊 Multi-stage build otimizado

### 4️⃣ Cloudflare Workers (Edge Computing)

Deploy global em 300+ data centers com **Durable Objects** para estado persistente:

#### 🎯 Arquitetura com Durable Objects

O MCP Senado utiliza **4 Durable Objects** para gerenciar estado distribuído:

| Durable Object | Função | Benefício |
|---|---|---|
| **CacheDurableObject** | Cache LRU persistente com TTL | Cache compartilhado entre todas as requisições globalmente |
| **RateLimiterDurableObject** | Rate limiting com token bucket | Limites de taxa distribuídos e precisos |
| **CircuitBreakerDurableObject** | Circuit breaker pattern (CLOSED/OPEN/HALF_OPEN) | Proteção contra falhas em cascata da API |
| **MetricsDurableObject** | Métricas agregadas e analytics | Observabilidade em tempo real de todas as requisições |

**Por que Durable Objects?**
- 🔄 **Estado persistente** entre todas as requisições Workers
- 🌍 **Consistência global** através de todos os 300+ data centers
- ⚡ **Performance** com cache compartilhado e circuit breaker distribuído
- 📊 **Métricas precisas** agregadas de todas as instâncias Workers

#### 📋 Pré-requisitos

1. **Conta Cloudflare** com acesso a Durable Objects (plano Workers Paid - $5/mês)
2. **Wrangler CLI** instalado

```bash
npm install -g wrangler
wrangler login
```

#### 🚀 Deploy Passo a Passo

**1. Build do projeto:**

```bash
npm run build
```

Isso compila TypeScript para JavaScript e gera:
- `build/workers/index.js` - Entry point do Worker
- `build/durable-objects/*.js` - Código dos Durable Objects

**2. Deploy inicial (development):**

```bash
npm run deploy:workers
# ou manualmente:
wrangler deploy --env development
```

**3. Deploy para produção:**

```bash
npm run deploy:workers:production
# ou manualmente:
wrangler deploy --env production
```

**4. Verificar deployment:**

```bash
# Ver status dos Durable Objects
wrangler deployments list

# Logs em tempo real
wrangler tail
```

#### 🔧 Configuração (`wrangler.toml`)

```toml
name = "mcp-senado"
main = "build/workers/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Durable Objects Bindings
[[durable_objects.bindings]]
name = "CACHE"
class_name = "CacheDurableObject"
script_name = "mcp-senado"

[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiterDurableObject"
script_name = "mcp-senado"

[[durable_objects.bindings]]
name = "CIRCUIT_BREAKER"
class_name = "CircuitBreakerDurableObject"
script_name = "mcp-senado"

[[durable_objects.bindings]]
name = "METRICS"
class_name = "MetricsDurableObject"
script_name = "mcp-senado"

# Migrations (necessário para criar DOs)
[[migrations]]
tag = "v1"
new_classes = ["CacheDurableObject", "RateLimiterDurableObject", "CircuitBreakerDurableObject", "MetricsDurableObject"]

# Variáveis de ambiente
[vars]
MCP_SERVER_NAME = "mcp-senado"
MCP_SERVER_VERSION = "1.0.0"
SENADO_API_BASE_URL = "https://legis.senado.leg.br/dadosabertos"
SENADO_API_TIMEOUT = "30000"

# Cache
MCP_CACHE_ENABLED = "true"
MCP_CACHE_TTL = "300000"  # 5 minutos

# Rate Limiting
MCP_RATE_LIMIT_ENABLED = "true"
MCP_RATE_LIMIT_MAX_TOKENS = "30"
MCP_RATE_LIMIT_REFILL_RATE = "0.5"  # 0.5 tokens/segundo

# Circuit Breaker
MCP_CIRCUIT_BREAKER_ENABLED = "true"
MCP_CIRCUIT_BREAKER_THRESHOLD = "5"   # Falhas para abrir
MCP_CIRCUIT_BREAKER_TIMEOUT = "60000" # 1 minuto

# Logging
MCP_LOG_LEVEL = "INFO"

# Ambientes
[env.development]
name = "mcp-senado-dev"
vars = { ENVIRONMENT = "development" }

[env.production]
name = "mcp-senado-prod"
vars = { ENVIRONMENT = "production" }
# Descomentar e configurar sua rota:
# route = "mcp-senado.seudominio.com/*"
```

#### 🧪 Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento com Durable Objects
npm run dev:workers

# Servidor estará disponível em:
# http://localhost:8787
```

**Testando endpoints:**

```bash
# Health check
curl http://localhost:8787/health

# Listar ferramentas MCP
curl http://localhost:8787/v1/tools/list

# Invocar ferramenta
curl -X POST http://localhost:8787/v1/tools/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_senator",
    "arguments": {"codigo": "5012"}
  }'

# Métricas (do MetricsDurableObject)
curl http://localhost:8787/v1/metrics/global
```

#### 📊 Monitoramento de Durable Objects

**1. Métricas globais:**
```bash
curl https://mcp-senado-prod.seu-worker.workers.dev/v1/metrics/global
```

**2. Estatísticas de cache:**
```bash
curl https://mcp-senado-prod.seu-worker.workers.dev/v1/cache/stats
```

**3. Status do circuit breaker:**
```bash
curl https://mcp-senado-prod.seu-worker.workers.dev/v1/circuit-breaker/stats
```

**4. Rate limiter status:**
```bash
curl https://mcp-senado-prod.seu-worker.workers.dev/v1/rate-limiter/stats
```

#### 🎯 Boas Práticas

1. **Sempre faça build antes de deploy:**
   ```bash
   npm run build && npm run deploy:workers
   ```

2. **Teste localmente antes de produção:**
   ```bash
   npm run dev:workers
   # Testar thoroughly
   npm run deploy:workers  # Deploy em dev primeiro
   ```

3. **Monitor logs em produção:**
   ```bash
   wrangler tail --env production
   ```

4. **Use variáveis de ambiente corretas para cada ambiente:**
   - Development: mais logs, cache TTL menor
   - Production: logs INFO/WARN, cache TTL otimizado

#### 💰 Custos

**Cloudflare Workers + Durable Objects:**

| Recurso | Free Tier | Paid Plan ($5/mês) |
|---|---|---|
| Workers Requests | 100.000/dia | 10M incluídos |
| CPU Time | 10ms/req | 50ms/req |
| **Durable Objects** | ❌ Não disponível | ✅ Incluído |
| DO Requests | - | 1M incluídos |
| DO Storage | - | 1GB incluído |

**Estimativa de custos para 1M requisições/mês:**
- Workers: ~$0-5 (dependendo do uso)
- Durable Objects: ~$0-5 (storage + requests)
- **Total: ~$5-10/mês** para tráfego moderado

#### 🔐 Segurança

**Secrets (valores sensíveis):**

```bash
# Definir API key (opcional)
wrangler secret put MCP_API_KEY --env production

# Definir tokens de autenticação
wrangler secret put WORKERS_AUTH_TOKEN --env production
```

**Habilitar autenticação no Worker:**

```toml
[env.production.vars]
WORKERS_AUTH_ENABLED = "true"
```

Então use o header `Authorization` nas requisições:
```bash
curl -H "Authorization: Bearer seu-token-aqui" \
  https://mcp-senado-prod.seu-worker.workers.dev/v1/tools/list
```

#### ✨ Benefícios do Deploy com Durable Objects

- ⚡ **Zero cold starts** - Workers sempre quentes
- 🌍 **Latência ultra-baixa** - 300+ data centers globalmente
- 🔄 **Cache persistente** - Compartilhado entre todas as requisições
- 🛡️ **Circuit breaker distribuído** - Proteção contra falhas da API do Senado
- 📊 **Métricas precisas** - Analytics em tempo real agregadas
- 📈 **Escalabilidade automática** - De 0 a milhões de requisições
- 💰 **Custo otimizado** - Pague apenas pelo que usar
- 🔐 **DDoS protection** - Incluído automaticamente
- 🚀 **Deploy em segundos** - CI/CD integrado
- 🧪 **Desenvolvimento local fácil** - Emulador completo de DOs

---

### 5️⃣ Dokploy em VPS Hostinger

Implantação orquestrada pelo [Dokploy](https://dokploy.com/) em um VPS Hostinger aproveitando o mesmo `Dockerfile` e variáveis de ambiente do projeto.

- ✅ Ideal para fluxos de CI/CD self-hosted com pipelines Git
- 🔒 Mantém suporte a autenticação HTTP (`HTTP_AUTH_TOKEN`) e CORS customizado
- ⚙️ Compatível com tempo de execução Docker ou Node dentro do Dokploy
- 📘 Guia completo em [`docs/deployment/dokploy-hostinger.md`](./docs/deployment/dokploy-hostinger.md)

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# API do Senado Federal
SENADO_API_BASE_URL=https://legis.senado.leg.br/dadosabertos
SENADO_API_TIMEOUT=30000
SENADO_API_MAX_RETRIES=3
SENADO_API_RETRY_DELAY=1000

# Servidor HTTP (opcional)
HTTP_PORT=3000
HTTP_HOST=0.0.0.0
HTTP_CORS_ORIGIN=*
HTTP_AUTH_ENABLED=false
HTTP_AUTH_TOKEN=
HTTP_REQUEST_TIMEOUT=30000

# Transporte (stdio | http)
MCP_TRANSPORT=http

# Cache
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300000
MCP_CACHE_MAX_SIZE=1000
MCP_CACHE_CLEANUP_INTERVAL=60000

# Rate Limiting
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_TOKENS=30
MCP_RATE_LIMIT_INTERVAL=60000
MCP_RATE_LIMIT_REFILL_RATE=2000

# Circuit Breaker
MCP_CIRCUIT_BREAKER_ENABLED=true
MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
MCP_CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
MCP_CIRCUIT_BREAKER_TIMEOUT=60000

# Logging
MCP_LOG_LEVEL=info  # debug | info | warn | error
MCP_LOG_FORMAT=json  # json | text
MCP_LOG_MASK_PII=true

# Ambiente
NODE_ENV=production  # development | production | test
```

### Configuração Avançada

**Performance:**

```bash
# Cache agressivo (ideal para dados que mudam pouco)
MCP_CACHE_TTL=3600000       # 1 hora em ms
MCP_CACHE_MAX_SIZE=5000     # Mais entradas

# Rate limiting relaxado (para uso interno)
MCP_RATE_LIMIT_TOKENS=100
MCP_RATE_LIMIT_INTERVAL=60000
```

**Segurança:**

```bash
# Produção segura
HTTP_AUTH_ENABLED=true
HTTP_AUTH_TOKEN=token-forte-aqui
HTTP_CORS_ORIGIN=https://meu-dominio.com
MCP_LOG_MASK_PII=true
```

**Debug:**

```bash
# Modo de desenvolvimento
NODE_ENV=development
MCP_LOG_LEVEL=debug
MCP_LOG_FORMAT=text
MCP_CACHE_ENABLED=false  # Facilita debug
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Consultar Senadores

**Prompt para IA:**
```
"Liste todos os senadores do estado de São Paulo na legislatura atual"
```

**Resposta esperada:**
- Nome completo de cada senador
- Partido político
- Telefones e emails de contato
- Período do mandato

### Exemplo 2: Pesquisar Propostas

**Prompt para IA:**
```
"Busque propostas legislativas sobre educação que estão tramitando"
```

**Resultado:**
- Lista de PLs (Projetos de Lei)
- Ementa e descrição
- Status de tramitação
- Autores

### Exemplo 3: Acompanhar Votações

**Prompt para IA:**
```
"Mostre as votações do Senado nos últimos 7 dias e como cada senador votou"
```

**Informações retornadas:**
- Data e hora da votação
- Matéria votada
- Resultado (aprovado/rejeitado)
- Votos individuais por senador
- Orientação das bancadas

### Exemplo 4: Análise de Comissões

**Prompt para IA:**
```
"Quais comissões permanentes estão ativas e quem são os presidentes?"
```

**Dados fornecidos:**
- Nome da comissão
- Sigla
- Presidente atual
- Vice-presidente
- Número de membros

### Exemplo 5: Uso via API HTTP

```bash
# Consultar votações recentes
curl -X POST http://localhost:3000/api/tools/votacoes_listar \
  -H "Content-Type: application/json" \
  -d '{
    "dataInicio": "2024-01-01",
    "dataFim": "2024-12-31",
    "pagina": 1,
    "itensPorPagina": 10
  }'

# Detalhes de um senador
curl -X POST http://localhost:3000/api/tools/senador_detalhes \
  -H "Content-Type: application/json" \
  -d '{"codigo": 5012}'

# Propostas por tipo
curl -X POST http://localhost:3000/api/tools/materias_pesquisar \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PL",
    "ano": "2024",
    "tramitando": true
  }'
```

---

## 📚 Documentação

### Documentação Oficial

- **[README em Inglês](./README.en.md)** - Documentação em inglês
- **[Guia de Contribuição](./CONTRIBUTING.md)** - Como contribuir com o projeto
- **[Código de Conduta](./CODE_OF_CONDUCT.md)** - Normas da comunidade
- **[Segurança](./SECURITY.md)** - Política de segurança
- **[Changelog](./CHANGELOG.md)** - Histórico de versões
- **[Roadmap](./ROADMAP.md)** - Planejamento futuro

### Recursos Externos

- **[API Dados Abertos do Senado](https://legis.senado.leg.br/dadosabertos/)** - Documentação oficial da API
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Especificação MCP
- **[TypeScript](https://www.typescriptlang.org/)** - Documentação TypeScript
- **[Vitest](https://vitest.dev/)** - Framework de testes

### Suporte e Comunidade

- 🐛 **Issues**: [GitHub Issues](https://github.com/cristianoaredes/mcp-senado/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/cristianoaredes/mcp-senado/discussions)
- 📧 **Email**: Contato com mantenedores
- 🌟 **Star no GitHub**: Mostre seu apoio!

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este é um projeto open-source mantido pela comunidade.

### Como Contribuir

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/minha-feature`)
3. **Commit** suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/minha-feature`)
5. Abra um **Pull Request**

### Diretrizes

- ✅ Escreva testes para novas funcionalidades
- ✅ Mantenha cobertura de testes > 70%
- ✅ Siga o style guide TypeScript
- ✅ Documente alterações no código
- ✅ Use commits semânticos (conventional commits)
- ✅ Atualize documentação quando necessário

### Áreas que Precisam de Ajuda

- 📝 Documentação de ferramentas específicas
- 🧪 Testes adicionais (E2E, integração)
- 🌍 Traduções (inglês, espanhol)
- 🎨 Exemplos de uso
- 🐛 Correção de bugs
- ⚡ Otimizações de performance

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para guia completo.

---

## 🏗️ Arquitetura

### Estrutura do Projeto

```
mcp-senado/
├── lib/                      # Código fonte
│   ├── adapters/            # Adaptadores de transporte
│   │   ├── http.ts          # Adaptador HTTP/REST
│   │   └── workers.ts       # Adaptador Cloudflare Workers
│   ├── bin/                 # Entry points CLI
│   │   ├── mcp-senado.ts        # stdio (MCP)
│   │   └── mcp-senado-http.ts   # HTTP server
│   ├── config/              # Configuração
│   ├── core/                # Lógica core MCP
│   │   ├── mcp-server.ts    # Servidor MCP principal
│   │   ├── tools.ts         # Registry de ferramentas
│   │   ├── validation.ts    # Validação com Zod
│   │   └── errors.ts        # Tratamento de erros
│   ├── infrastructure/      # Infraestrutura
│   │   ├── cache.ts         # Cache LRU
│   │   ├── circuit-breaker.ts
│   │   ├── http-client.ts   # Cliente HTTP
│   │   ├── logger.ts        # Logging estruturado
│   │   └── rate-limiter.ts  # Rate limiting
│   ├── tools/               # Implementação das ferramentas
│   │   ├── reference-tools.ts
│   │   ├── senator-tools.ts
│   │   ├── proposal-tools.ts
│   │   ├── voting-tools.ts
│   │   ├── committee-tools.ts
│   │   ├── party-tools.ts
│   │   └── session-tools.ts
│   ├── types/               # Definições TypeScript
│   └── workers/             # Cloudflare Workers
├── test/                     # Testes
│   ├── core/                # Testes unitários core
│   ├── e2e/                 # Testes E2E
│   ├── infrastructure/      # Testes infra
│   └── integration/         # Testes integração
├── .github/workflows/       # CI/CD
└── docker/                   # Docker configs
```

### Stack Tecnológica

- **Runtime**: Node.js 18+
- **Linguagem**: TypeScript 5.7+ (strict mode)
- **Framework MCP**: @modelcontextprotocol/sdk
- **HTTP Server**: Express 5.x
- **Validação**: Zod
- **Testes**: Vitest (211 testes, 73% coverage)
- **Build**: TypeScript Compiler
- **Deploy**: Docker, Cloudflare Workers
- **CI/CD**: GitHub Actions

---

## 📈 Status do Projeto

### Métricas

- ✅ **211 testes** passando (2 skipped)
- ✅ **73% cobertura** de código
- ✅ **56 ferramentas** implementadas
- ✅ **7 categorias** de dados
- ✅ **4 modos** de deployment
- ✅ **0 vulnerabilidades** de segurança

### Versão Atual

**v0.1.0** - Primeira versão pública
- Core MCP server completo
- 56 ferramentas funcionais
- 4 adaptadores de transporte
- Documentação completa
- CI/CD configurado

### Próximos Passos

- [ ] Publicação no NPM oficial
- [ ] Suporte a webhooks do Senado
- [ ] Interface web de demonstração
- [ ] Expansão para Câmara dos Deputados
- [ ] SDK JavaScript/TypeScript
- [ ] Integração com mais assistentes de IA

Veja [ROADMAP.md](./ROADMAP.md) para planejamento completo.

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](./LICENSE) para detalhes.

### Termos

- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ⚠️ Sem garantias
- ⚠️ Limitação de responsabilidade

---

## 🙏 Agradecimentos

- **Senado Federal** - Pela API de Dados Abertos
- **Anthropic** - Pelo Model Context Protocol
- **Comunidade Open Source** - Por tornar isso possível
- **Contribuidores** - Obrigado por cada PR e issue!

---

## 📞 Contato

- **GitHub**: [@cristianoaredes](https://github.com/cristianoaredes)
- **Issues**: [Reportar bug ou sugerir feature](https://github.com/cristianoaredes/mcp-senado/issues)
- **Discussions**: [Fórum da comunidade](https://github.com/cristianoaredes/mcp-senado/discussions)

---

<p align="center">
  Feito com ❤️ para a transparência e democracia brasileira<br>
  <sub>Dados abertos • Código aberto • Democracia aberta</sub>
</p>

<p align="center">
  <a href="#mcp-senado-federal-">⬆️ Voltar ao topo</a>
</p>
