# ⚡ EXECUTE AGORA - Comandos Prontos para SEO

**Copie e cole os comandos abaixo para implementar todas as otimizações de SEO.**

---

## 1️⃣ VERIFICAR ALTERAÇÕES (30 segundos)

```bash
cd /Users/cristianocosta/workspace/mcp-workspace/senado-mcp

# Ver arquivos modificados
git status

# Ver diferenças em smithery.yaml
git diff smithery.yaml

# Ver diferenças em package.json
git diff package.json
```

**Arquivos alterados:**
- ✅ `smithery.yaml` - Descrição e keywords otimizadas
- ✅ `package.json` - Description e keywords expandidas
- ✅ `SEO_STRATEGY.md` - Estratégia completa de SEO
- ✅ `SEO_QUICK_WINS.md` - Guia de implementação rápida
- ✅ `EXECUTE_NOW.md` - Este arquivo

---

## 2️⃣ COMMITAR MUDANÇAS (1 minuto)

```bash
# Stage das alterações
git add smithery.yaml package.json SEO_STRATEGY.md SEO_QUICK_WINS.md EXECUTE_NOW.md

# Commit com mensagem semântica
git commit -m "feat(seo): optimize Smithery listing and package metadata for discovery

- Update smithery.yaml description with SEO-friendly keywords
- Add 23 optimized keywords (primary, secondary, technical, use-case)
- Expand package.json keywords from 17 to 28
- Add comprehensive SEO strategy documentation (SEO_STRATEGY.md)
- Add quick wins implementation guide (SEO_QUICK_WINS.md)
- Target keywords: brazilian senate api, legislative data mcp, voting records

Expected impact:
- Improve Smithery.ai internal search ranking
- Better Google organic discovery
- Higher CTR from developer/researcher audience"

# Push para GitHub
git push origin master
```

---

## 3️⃣ PUBLICAR NOVA VERSÃO NO NPM (2 minutos)

```bash
# Incrementar versão patch (0.2.0 -> 0.2.1)
npm version patch

# Ou incrementar versão minor se houver features novas (0.2.0 -> 0.3.0)
# npm version minor

# Build do projeto
npm run build

# Publicar no NPM (keywords atualizadas)
npm publish

# Verificar publicação
npm view @aredes.me/mcp-senado
```

**Por que isso importa:**
- NPM indexa keywords automaticamente
- Descrição otimizada aparece no npm search
- Google indexa páginas do NPM

---

## 4️⃣ ATUALIZAR SMITHERY.AI (5 minutos)

### Opção A: Via GitHub (Automático)
Se o Smithery monitora o repositório:
```bash
# Apenas aguarde a sincronização automática (5-30 minutos)
```

### Opção B: Submissão Manual
Se necessário submeter manualmente:

1. Acesse: https://smithery.ai/submit
2. Cole o link: `https://github.com/cristianoaredes/mcp-senado`
3. Ou atualize diretamente: https://smithery.ai/server/mcp-senado/edit

**Verifique:**
- Descrição está atualizada
- Keywords aparecem corretamente
- Categorias estão ordenadas

---

## 5️⃣ ADICIONAR GITHUB TOPICS (2 minutos)

**Navegue para:**
```
https://github.com/cristianoaredes/mcp-senado
```

**Clique em "⚙️ Settings" (aba direita, próximo a "About")**

**Adicione os seguintes topics (separados por vírgula):**
```
brazilian-senate, legislative-data, mcp-server, senado-federal,
voting-records, political-transparency, data-journalism,
model-context-protocol, claude, cloudflare-workers, congress-api,
open-data, civic-tech, parliamentary-data, government-api
```

**Clique em "Save changes"**

---

## 6️⃣ ATUALIZAR README.md - H1 (5 minutos)

```bash
# Abrir README.md no editor
code README.md
# ou
vim README.md
# ou
nano README.md
```

**Localizar linha 1-4 e substituir:**

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

**Salvar e commitar:**
```bash
git add README.md
git commit -m "docs(seo): optimize README.md H1 and description for discovery"
git push origin master
```

---

## 7️⃣ ADICIONAR FAQ AO README (10 minutos)

**Abrir README.md e adicionar antes da seção "## 📄 Licença":**

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

---
```

**Commitar:**
```bash
git add README.md
git commit -m "docs(seo): add FAQ section for rich snippets and better discovery"
git push origin master
```

---

## 8️⃣ LINK BUILDING - PR EM AWESOME LISTS (15 minutos)

### awesome-mcp-servers

```bash
# Fork via GitHub UI primeiro: https://github.com/punkpeye/awesome-mcp-servers

# Clone seu fork
git clone https://github.com/SEU_USUARIO/awesome-mcp-servers.git
cd awesome-mcp-servers

# Criar branch
git checkout -b add-mcp-senado

# Editar README.md
# Adicionar na seção "Government & Politics" (criar se não existir):

# Government & Politics

- [mcp-senado](https://github.com/cristianoaredes/mcp-senado) - Official MCP server for Brazilian Federal Senate Open Data API. Query senator voting records, legislative proposals, committee activities. 56 tools for legislative transparency and political research. Available on [npm](https://www.npmjs.com/package/@aredes.me/mcp-senado) and [Smithery](https://smithery.ai/server/mcp-senado).

# Commit
git add README.md
git commit -m "Add mcp-senado - Brazilian Federal Senate API server"
git push origin add-mcp-senado

# Abrir PR via GitHub UI
# Título: "Add mcp-senado - Brazilian Federal Senate API server"
```

---

## 9️⃣ POSTS SOCIAIS (30 minutos total)

### Dev.to (15 minutos)

**Acesse:** https://dev.to/new

**Use template completo em:** `SEO_QUICK_WINS.md` seção 6

### Reddit r/LocalLLaMA (5 minutos)

**Acesse:** https://www.reddit.com/r/LocalLLaMA/submit

**Título:**
```
[Project] MCP Senado - Open-source server for Brazilian legislative data (56 tools for Claude/Cursor/Windsurf)
```

**Flair:** `News/Update`

**Use template em:** `SEO_QUICK_WINS.md` seção 7

### Reddit r/brasil (5 minutos)

**Acesse:** https://www.reddit.com/r/brasil/submit

**Título:**
```
[Projeto Open-Source] Servidor MCP para dados do Senado Federal - consulte informações legislativas com IA
```

**Flair:** `Tecnologia`

**Use template em:** `SEO_QUICK_WINS.md` seção 8

---

## 🔟 MONITORAMENTO (5 minutos)

### Configurar Google Search Console

```bash
# 1. Acesse: https://search.google.com/search-console
# 2. Adicionar propriedade: https://github.com/cristianoaredes/mcp-senado
# 3. Verificar via GitHub (arquivo HTML ou DNS)
# 4. Aguardar indexação (48-72h)
```

### Configurar NPM Stats Tracker

```bash
# Verificar downloads
npm view @aredes.me/mcp-senado

# Ou via npmtrends
# https://npmtrends.com/@aredes.me/mcp-senado
```

### Configurar GitHub Insights

```bash
# Acesse: https://github.com/cristianoaredes/mcp-senado/pulse
# Monitorar:
# - Stars (objetivo: 100+ em 90 dias)
# - Forks (objetivo: 20+ em 90 dias)
# - Traffic (unique visitors)
```

---

## ✅ CHECKLIST FINAL

Marque cada item conforme completar:

- [ ] Commit e push das alterações (smithery.yaml, package.json)
- [ ] Publicar nova versão no NPM
- [ ] Atualizar Smithery.ai
- [ ] Adicionar GitHub Topics
- [ ] Atualizar README.md H1
- [ ] Adicionar FAQ ao README
- [ ] PR no awesome-mcp-servers
- [ ] Post no Dev.to
- [ ] Post no Reddit r/LocalLLaMA
- [ ] Post no Reddit r/brasil
- [ ] Configurar Google Search Console
- [ ] Configurar monitoramento NPM
- [ ] Configurar GitHub Insights

---

## 📊 MÉTRICAS DE SUCESSO (Acompanhar)

### Após 7 dias:
- [ ] 3-5 backlinks de awesome lists
- [ ] 500+ views no Dev.to
- [ ] 100+ views no Reddit
- [ ] Indexação inicial no Google

### Após 30 dias:
- [ ] Top 5 no Smithery.ai para "brazil"
- [ ] Top 20 no Google para "brazilian senate api mcp"
- [ ] 50+ npm downloads/semana
- [ ] 10+ GitHub stars

### Após 90 dias:
- [ ] #1 no Smithery.ai para "brazil"
- [ ] Top 10 no Google para keywords primárias
- [ ] 200+ npm downloads/semana
- [ ] 100+ GitHub stars

---

## 🚀 PRÓXIMOS PASSOS (Após Quick Wins)

Veja estratégia completa em `SEO_STRATEGY.md`:

1. Email para professores universitários
2. Contato com veículos de jornalismo
3. Criar landing page otimizada
4. YouTube demo video
5. Workshop em universidades

---

**Tempo total estimado:** 1-2 horas
**ROI esperado:** Alto (melhoria significativa em descoberta)

**Dúvidas?** Veja documentação completa em:
- `SEO_STRATEGY.md` - Estratégia completa
- `SEO_QUICK_WINS.md` - Implementação detalhada

**Boa sorte! 🚀**
