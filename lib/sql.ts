/**
 * Conexão com o Postgres (Neon, instalado pela aba Storage da Vercel). Só o
 * servidor fala com o banco.
 *
 * As tabelas nascem sozinhas na primeira consulta (garantirTabelas), então
 * ninguém precisa rodar nada no banco à mão.
 */

import postgres from 'postgres';

/**
 * A Vercel cria a variável com nomes diferentes conforme a tela usada
 * (DATABASE_URL, POSTGRES_URL, ou com prefixo, como STORAGE_DATABASE_URL).
 * Vale a primeira que existir.
 */
function acharUrl(): string {
  const env = process.env;
  const direta = env.DATABASE_URL || env.POSTGRES_URL;
  if (direta) return direta;
  const chave = Object.keys(env).find((k) => /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && env[k]);
  if (chave) return env[chave]!;
  // qualquer prefixo (STORAGE_URL, NEON_URL…): a primeira *_URL que for endereço de Postgres
  const qualquer = Object.keys(env)
    .sort()
    .find((k) => k.endsWith('_URL') && !/UNPOOLED|NON_POOLING/.test(k) && /^postgres(ql)?:\/\//.test(env[k] || ''));
  return qualquer ? env[qualquer]! : '';
}

/**
 * O endereço do Neon vem com channel_binding=require, que o postgres.js
 * repassa ao servidor como configuração e o servidor recusa. A conexão
 * continua criptografada (ssl) sem ele.
 */
function limparUrl(bruta: string): string {
  try {
    const u = new URL(bruta);
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return bruta;
  }
}

const URL_BANCO = limparUrl(acharUrl());

export const temBanco = Boolean(URL_BANCO);

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __tdSql?: Sql; __tdPronto?: Promise<void> };

function criar(): Sql {
  const local = /localhost|127\.0\.0\.1|sslmode=disable/.test(URL_BANCO);
  return postgres(URL_BANCO, { prepare: false, ssl: local ? false : 'require', max: 3, idle_timeout: 20, connect_timeout: 15 });
}

function bruto(): Sql {
  if (!URL_BANCO) throw new Error('SEM_BANCO');
  if (!g.__tdSql) g.__tdSql = criar();
  return g.__tdSql;
}

/** o banco, já com as tabelas criadas */
export async function db(): Promise<Sql> {
  const sql = bruto();
  if (!g.__tdPronto) {
    g.__tdPronto = garantirTabelas(sql).catch((e) => {
      g.__tdPronto = undefined;
      throw e;
    });
  }
  await g.__tdPronto;
  return sql;
}

/** para a tela de erro: o que deu errado, sem mostrar endereço nem senha */
export async function diagnostico(): Promise<{ ok: boolean; texto: string }> {
  if (!URL_BANCO) return { ok: false, texto: 'O painel não achou o banco. Conecte o Neon em Storage na Vercel e faça Redeploy.' };
  try {
    const sql = await db();
    await sql`select 1`;
    return { ok: true, texto: 'Banco conectado.' };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const msg = String(err.message || '').replace(/postgres(ql)?:\/\/\S+/gi, '[endereço]').slice(0, 200);
    return { ok: false, texto: `O banco respondeu com erro${err.code ? ` (${err.code})` : ''}: ${msg}` };
  }
}

async function garantirTabelas(sql: Sql) {
  await sql`
    create table if not exists propostas (
      id text primary key,
      token text not null,
      dados jsonb not null,
      tabela jsonb not null,
      status text not null default 'rascunho',
      criada_em timestamptz not null default now(),
      atualizada_em timestamptz not null default now(),
      enviada_em timestamptz,
      aberta_em timestamptz,
      aberturas int not null default 0,
      aceite jsonb,
      recusada_em timestamptz
    )
  `;
  await sql`create index if not exists propostas_atualizada on propostas (atualizada_em desc)`;
  await sql`
    create table if not exists configuracoes (
      id int primary key default 1 check (id = 1),
      tabela jsonb not null,
      atualizada_em timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists tentativas (
      chave text not null,
      em timestamptz not null default now()
    )
  `;
  await sql`create index if not exists tentativas_chave on tentativas (chave, em)`;
}
