# 🚀 SEO Quick Wins - Implementação Imediata

**Tempo estimado:** 30 minutos
**Impacto:** Alto (melhora imediata em descoberta)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### 1. GitHub Repository Topics (2 minutos)

**Acessar:** https://github.com/cristianoaredes/mcp-senado/settings

**Adicionar topics (separados por vírgula):**
```
brazilian-senate, legislative-data, mcp-server, senado-federal,
voting-records, political-transparency, data-journalism,
model-context-protocol, claude, cloudflare-workers, congress-api,
open-data, civic-tech, parliamentary-data, government-api
```

**Por que funciona:**
- GitHub usa topics para descoberta interna
- Aparecer em pesquisas de repositórios relacionados
- Melhor ranqueamento em GitHub Explore

---

### 2. README.md - Otimizar H1 e Subtítulo (5 minutos)

**Arquivo:** `/Users/cristianocosta/workspace/mcp-workspace/senado-mcp/README.md`

**Substituir linha 1-4:**

**DE:**
```markdown
# MCP Senado Federal 🇧🇷

> **Servidor MCP para API de Dados Abertos do Senado Federal Brasileiro**
> Conecte assistentes de IA como Claude, Cursor, Windsurf e Continue.dev aos dados legislativos oficiais do Congresso Nacional
```

**PARA:**
```markdown
# MCP Senado Federal 🇧🇷 | Brazilian Senate Open Data API for AI Assistants

> **Official MCP Server** for querying Brazilian Federal Senate (Senado Federal) legislative data via Claude, Cursor, Windsurf, and Continue.dev
> Access senator voting records, legislative proposals, committee activities, and congress sessions. 56 tools for legislative transparency, political research, and data journalism.
```

**Benefício:**
- Keywords primárias no H1 (indexação Google)
- Descrição otimizada nos primeiros 160 caracteres
- Bilíngue (atrai audiência internacional)

---

### 3. Adicionar FAQ Section ao README (10 minutos)

**Arquivo:** `/Users/cristianocosta/workspace/mcp-workspace/senado-mcp/README.md`

**Adicionar antes da seção "## 📄 Licença":**

```markdown
---

## ❓ Perguntas Frequentes (FAQ)

### O que é MCP Senado Federal?
MCP Senado é um servidor oficial do Model Context Protocol que conecta assistentes de IA à API de Dados Abertos do Senado Federal Brasileiro, permitindo consultas sobre senadores, propostas legislativas, votações e atividades do Congresso.

### Como integrar com Claude Desktop?
Adicione a seguinte configuração ao seu `claude_desktop_config.json`:

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

**Localização do arquivo:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Posso usar para pesquisa política?
Sim! O MCP Senado oferece 56 ferramentas perfeitas para pesquisa política, jornalismo de dados e estudos acadêmicos sobre comportamento legislativo brasileiro.

### Os dados são oficiais e atualizados?
Todos os dados vêm diretamente da API oficial de Dados Abertos do Senado Federal (https://legis.senado.leg.br/dadosabertos), mantida pelo governo brasileiro.

### Quais idiomas são suportados?
O servidor suporta português (PT-BR) e inglês. Os nomes das ferramentas estão em português, mas a documentação é totalmente bilíngue.

### Posso fazer deploy em produção?
Sim! Faça deploy via Docker, Cloudflare Workers (com Durable Objects) ou como servidor HTTP/REST standalone. Veja a documentação de deployment.

### É gratuito?
Sim! O projeto é open-source (licença MIT) e a API do Senado é pública e gratuita. Se você usar Cloudflare Workers, há um plano gratuito disponível (com limitações).

### Como contribuir com o projeto?
Contribuições são muito bem-vindas! Veja o guia completo em [CONTRIBUTING.md](./CONTRIBUTING.md) e o resumo em [AGENTS.md](./AGENTS.md).
```

**Benefício:**
- Google exibe FAQs em rich snippets
- Aumenta CTR (click-through rate)
- Responde search intent de longo prazo

---

### 4. Atualizar README.en.md (5 minutos)

**Arquivo:** `/Users/cristianocosta/workspace/mcp-workspace/senado-mcp/README.en.md`

**Atualizar H1 para:**
```markdown
# MCP Senado Federal 🇧🇷 | Brazilian Senate Open Data API for AI Assistants
```

**Adicionar mesma FAQ section traduzida**

---

### 5. Pull Request em Awesome Lists (10 minutos)

#### 5.1 Awesome MCP Servers

**Repositório:** https://github.com/punkpeye/awesome-mcp-servers

**Fork + Clone:**
```bash
git clone https://github.com/SEU_USER/awesome-mcp-servers.git
cd awesome-mcp-servers
```

**Editar README.md:**

Adicionar na seção **"Government & Politics"** (criar se não existir):

```markdown
### Government & Politics

- [mcp-senado](https://github.com/cristianoaredes/mcp-senado) - Official MCP server for Brazilian Federal Senate Open Data API. Query senator voting records, legislative proposals, committee activities. 56 tools for legislative transparency and political research. Available on [npm](https://www.npmjs.com/package/@aredes.me/mcp-senado) and [Smithery](https://smithery.ai/server/mcp-senado).
```

**Commit + Push:**
```bash
git add README.md
git commit -m "Add mcp-senado - Brazilian Senate Open Data API server"
git push origin master
```

**Abrir PR:**
- Título: `Add mcp-senado - Brazilian Federal Senate API server`
- Descrição:
```markdown
## MCP Senado Federal 🇧🇷

Official MCP server for Brazilian Federal Senate Open Data API.

**Features:**
- 56 tools across 7 categories (senators, proposals, voting, committees, etc.)
- Supports Claude Desktop, Cursor, Windsurf, Continue.dev
- Multiple deployment modes (Docker, Cloudflare Workers, HTTP/REST)
- Bilingual documentation (Portuguese and English)

**Use cases:**
- Legislative transparency
- Political research
- Data journalism
- Academic studies

**Links:**
- GitHub: https://github.com/cristianoaredes/mcp-senado
- NPM: https://www.npmjs.com/package/@aredes.me/mcp-senado
- Smithery: https://smithery.ai/server/mcp-senado

MIT License | 56 tools | TypeScript
```

---

#### 5.2 Model Context Protocol Servers Directory

**Repositório:** https://github.com/modelcontextprotocol/servers

**Verificar se aceita PRs de terceiros** (pode ser apenas oficial)

**Se aceitar:**
```bash
git clone https://github.com/SEU_USER/servers.git
cd servers
```

**Criar arquivo `src/senado/README.md`:**
```markdown
# MCP Senado Federal

Official MCP server for Brazilian Federal Senate (Senado Federal) Open Data API.

## Installation

```bash
npm install -g @aredes.me/mcp-senado
```

## Configuration

Add to your MCP client configuration:

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

## Features

- 56 tools for querying legislative data
- Senator voting records
- Legislative proposals and bills
- Committee activities
- Congress sessions
- Party and bloc information

## Links

- GitHub: https://github.com/cristianoaredes/mcp-senado
- NPM: https://www.npmjs.com/package/@aredes.me/mcp-senado
- Smithery: https://smithery.ai/server/mcp-senado
```

---

### 6. Post no Dev.to (30 minutos de escrita)

**Criar artigo:** https://dev.to/new

**Metadata:**
```yaml
---
title: How to Query Brazilian Senate Data with Claude Desktop
published: true
description: Tutorial on connecting Claude AI to Brazilian Federal Senate Open Data API using MCP Senado
tags: ai, claude, mcp, brazil
canonical_url: https://github.com/cristianoaredes/mcp-senado
cover_image: https://raw.githubusercontent.com/cristianoaredes/mcp-senado/master/docs/assets/cover.png
---
```

**Estrutura do artigo:**
```markdown
# How to Query Brazilian Senate Data with Claude Desktop

Learn how to install and use **MCP Senado**, an open-source Model Context Protocol server that brings Brazilian legislative data to AI assistants like Claude, Cursor, and Windsurf.

## What You'll Build
- Query senator voting records with natural language
- Analyze legislative proposals and bills
- Track committee activities and congress sessions

## Prerequisites
- Claude Desktop (or Cursor/Windsurf/Continue.dev)
- Node.js 18+

## Step 1: Install MCP Senado

```bash
npm install -g @aredes.me/mcp-senado
```

Or use directly with `npx`:
```bash
npx @aredes.me/mcp-senado
```

## Step 2: Configure Claude Desktop

Edit `claude_desktop_config.json`:

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

**Config file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Step 3: Restart Claude Desktop

Restart Claude Desktop to load the new MCP server.

## Step 4: Try Sample Queries

Ask Claude:

```
"List all senators from São Paulo state"
"What were the latest voting sessions in the Senate?"
"Show legislative proposals about education"
```

## Example Output

[Screenshot da resposta do Claude com dados do Senado]

## Use Cases

### 1. Data Journalism
Track voting patterns and legislative activity for investigative reporting.

### 2. Political Research
Analyze parliamentary behavior and legislative production for academic studies.

### 3. Transparency Tools
Build civic applications for monitoring congress activities.

## Advanced: Deploy Your Own Instance

### Docker
```bash
docker run -p 3000:3000 ghcr.io/cristianoaredes/mcp-senado
```

### Cloudflare Workers
```bash
npm run deploy:workers
```

See [deployment docs](https://github.com/cristianoaredes/mcp-senado#deployment) for details.

## Available Tools (56 total)

- **Senator Tools** (13): Query senator data, voting records, speeches
- **Proposal Tools** (12): Search bills, amendments, legislative texts
- **Voting Tools** (5): Access voting sessions and results
- **Committee Tools** (5): Query committee composition and activities
- **Party Tools** (5): Analyze political parties and blocs
- **Session Tools** (6): Track plenary sessions
- **Reference Tools** (10): Access metadata and classifications

## Links

- **GitHub**: https://github.com/cristianoaredes/mcp-senado
- **NPM**: https://www.npmjs.com/package/@aredes.me/mcp-senado
- **Smithery**: https://smithery.ai/server/mcp-senado
- **Documentation**: Full docs in Portuguese and English

## Contributing

Contributions are welcome! See the [contributing guide](https://github.com/cristianoaredes/mcp-senado/blob/master/CONTRIBUTING.md).

---

**Tags:** #ai #claude #mcp #brazil #opendata #civictech
```

---

### 7. Post no Reddit r/LocalLLaMA (10 minutos)

**Subreddit:** https://www.reddit.com/r/LocalLLaMA/submit

**Título:**
```
[Project] MCP Senado - Open-source server for Brazilian legislative data (56 tools for Claude/Cursor/Windsurf)
```

**Flair:** `News/Update` ou `Resources`

**Conteúdo:**
```markdown
Hey folks! 👋

I've built an open-source MCP server that connects AI assistants to the Brazilian Federal Senate Open Data API.

**What it does:**
- 56 tools for querying legislative data (senators, bills, voting records, committees)
- Works with Claude Desktop, Cursor, Windsurf, Continue.dev
- Deploy anywhere: Docker, Cloudflare Workers, HTTP/REST API

**Use cases:**
- Political research
- Data journalism
- Government transparency tools

**Example queries:**
- "List all senators from São Paulo and their voting records"
- "Show legislative proposals about education from 2024"
- "What were the latest committee meetings?"

**Tech stack:**
- TypeScript (strict mode)
- Model Context Protocol
- Cloudflare Workers with Durable Objects
- 211 tests, 73% coverage

**Links:**
- GitHub: https://github.com/cristianoaredes/mcp-senado
- NPM: https://www.npmjs.com/package/@aredes.me/mcp-senado
- Smithery: https://smithery.ai/server/mcp-senado

Open to feedback and contributions! Let me know if you have questions.
```

---

### 8. Post no Reddit r/brasil (10 minutos)

**Subreddit:** https://www.reddit.com/r/brasil/submit

**Título:**
```
[Projeto Open-Source] Servidor MCP para dados do Senado Federal - consulte informações legislativas com IA
```

**Flair:** `Tecnologia`

**Conteúdo:**
```markdown
Opa pessoal! 👋

Desenvolvi um servidor MCP open-source que conecta assistentes de IA (como Claude, Cursor, etc.) à API de Dados Abertos do Senado Federal.

**O que faz:**
- 56 ferramentas para consultar dados legislativos (senadores, propostas, votações, comissões)
- Funciona com Claude Desktop, Cursor, Windsurf, Continue.dev
- Deploy fácil via Docker, Cloudflare Workers ou API REST

**Casos de uso:**
- Pesquisa política
- Jornalismo de dados
- Ferramentas de transparência

**Exemplos de consultas:**
- "Liste todos os senadores de São Paulo e seus registros de votação"
- "Mostre propostas legislativas sobre educação de 2024"
- "Quais foram as últimas reuniões de comissões?"

**Stack técnica:**
- TypeScript (strict mode)
- Model Context Protocol
- Cloudflare Workers com Durable Objects
- 211 testes, 73% de cobertura

**Links:**
- GitHub: https://github.com/cristianoaredes/mcp-senado
- NPM: https://www.npmjs.com/package/@aredes.me/mcp-senado
- Smithery: https://smithery.ai/server/mcp-senado

Aberto a feedback e contribuições! Qualquer dúvida é só perguntar.
```

---

## 📊 IMPACTO ESPERADO

### Curto Prazo (7 dias)
- ✅ 3-5 backlinks de qualidade (awesome lists)
- ✅ 500+ views no Dev.to
- ✅ 100+ views no Reddit
- ✅ Indexação inicial do Google

### Médio Prazo (30 dias)
- ✅ Top 5 no Smithery.ai para "brazil"
- ✅ Top 20 no Google para "brazilian senate api mcp"
- ✅ 50+ npm downloads/semana
- ✅ 10+ GitHub stars

### Longo Prazo (90 dias)
- ✅ #1 no Smithery.ai para "brazil"
- ✅ Top 10 no Google para keywords primárias
- ✅ 200+ npm downloads/semana
- ✅ 100+ GitHub stars

---

## 🎯 PRÓXIMOS PASSOS

Após implementar os quick wins:

1. **Email para professores universitários** (template no SEO_STRATEGY.md)
2. **Contato com veículos de jornalismo** (Nexo, Poder360, Agência Pública)
3. **Criar landing page otimizada** (opcional, mas recomendado)
4. **YouTube demo video** (aumenta engagement)
5. **Monitorar Google Search Console** (rastrear performance)

---

**Tempo total estimado:** 1-2 horas
**ROI esperado:** Alto (melhoria significativa em descoberta)

✅ Marque cada item conforme completar!
