# MCP Senado Federal — Status Resumido

**Atualizado em:** 2025-11-14  
**Estado geral:** Servidor MCP completo e em operação, atendendo via CLI, HTTP e Cloudflare Workers.

## Visão Instantânea
- 56 ferramentas publicadas cobrindo referência, senadores, matérias, votações, comissões, partidos e sessões.
- Infraestrutura resiliente com cliente HTTP (XML→JSON), cache LRU, circuit breaker, rate limiter e logger estruturado.
- Deploys automatizados: pacote npm, servidor HTTP Express e Worker com Durable Objects (cache, rate limit, métricas).
- Qualidade: 211 testes Vitest, 73 % de cobertura, smoke tests remotos (`npm run smoke`).

## Indicadores
| Indicador | Valor |
|-----------|-------|
| Versão atual | 0.1.0 |
| Ferramentas registradas | 56 |
| Cobertura de testes | 73 % |
| Ambiente Node exigido | ≥ 18 |
| Principais clientes MCP | Claude, Cursor, Windsurf, Continue |

## Próximas Ações
1. Expandir documentação técnica de APIs/configurações (docs/deployment e docs/plan) com os detalhes já implementados.
2. Automatizar atualização periódica dos indicadores (testes, cobertura, contagem de ferramentas) no README e neste status.
3. Monitorar a API do Senado para ajustes de esquema e manter smoke tests apontando para o Worker público.
