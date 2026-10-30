/**
 * Conexão com o Postgres (Neon, instalado pela aba Storage da Vercel, que
 * cria sozinho a variável DATABASE_URL). Só o servidor fala com o banco.
 *
 * As tabelas nascem sozinhas na primeira consulta (garantirTabelas), então
 * ninguém precisa rodar nada no banco à mão.
 */

import postgres from 'postgres';

const URL_BANCO = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __tdSql?: Sql; __tdPronto?: Promise<void> };

function criar(): Sql {
  const local = /localhost|127\.0\.0\.1|sslmode=disable/.test(URL_BANCO);
  return postgres(URL_BANCO, { prepare: false, ssl: local ? false : 'require', max: 3, idle_timeout: 20, connect_timeout: 15 });
}

function bruto(): Sql {
  if (!URL_BANCO) throw new Error('Banco não configurado: conecte o banco na aba Storage da Vercel (cria a variável DATABASE_URL).');
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
