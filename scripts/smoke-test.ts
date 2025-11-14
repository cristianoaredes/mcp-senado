#!/usr/bin/env ts-node
import process from 'node:process';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://mcp-senado.cristianoaredes.workers.dev';

type TestDefinition = {
  name: string;
  path: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
};

const tests: TestDefinition[] = [
  { name: 'health', path: '/health', method: 'GET' },
  { name: 'ufs_listar', path: '/api/tools/ufs_listar', body: {} },
  { name: 'senadores_SP', path: '/api/tools/senadores_listar', body: { uf: 'SP' } },
  { name: 'materias_pl', path: '/api/tools/materias_pesquisar', body: { sigla: 'PL', ano: 2024, itens: 2 } },
  { name: 'comissoes', path: '/api/tools/comissoes_listar', body: { itens: 2 } },
  { name: 'votacoes', path: '/api/tools/votacoes_listar', body: { data: '2023-12-12', itens: 1 } },
];

async function runTest(test: TestDefinition): Promise<void> {
  const method = test.method ?? 'POST';
  const url = new URL(test.path, BASE_URL);
  const response = await fetch(url.toString(), {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify(test.body ?? {}) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Test "${test.name}" failed with status ${response.status}: ${text}`);
  }

  const result = await response.json();
  if ((result as any)?.error || (result as any)?.isError) {
    throw new Error(`Test "${test.name}" returned error payload: ${JSON.stringify(result)}`);
  }

  console.log(`✔ ${test.name}`);
}

async function main(): Promise<void> {
  for (const test of tests) {
    await runTest(test);
  }

  console.log(`All smoke tests passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error('Smoke tests failed:', error);
  process.exit(1);
});
