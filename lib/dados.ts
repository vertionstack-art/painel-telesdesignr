/**
 * Propostas e configurações no banco. Toda função daqui roda só no servidor.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './sql';
import { COOKIE, sessaoValida } from './sessao';
import { TABELA_PADRAO, dadosValidos, tabelaCompleta, type DadosProposta, type Tabela } from './precos';

/** para páginas e ações do painel: quem não entrou volta para o login */
export async function exigirSessao(): Promise<void> {
  const c = await cookies();
  if (!(await sessaoValida(c.get(COOKIE)?.value))) redirect('/login');
}

export type Status = 'rascunho' | 'enviada' | 'aberta' | 'aceita' | 'recusada';

export interface Proposta {
  id: string;
  token: string;
  dados: DadosProposta;
  tabela: Tabela;
  status: Status;
  criadaEm: string;
  atualizadaEm: string;
  enviadaEm: string | null;
  abertaEm: string | null;
  aberturas: number;
  aceite: { nome: string; em: string } | null;
  recusadaEm: string | null;
}

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function daLinha(r: any): Proposta {
  return {
    id: r.id,
    token: r.token,
    dados: dadosValidos(r.dados),
    tabela: tabelaCompleta(r.tabela),
    status: r.status,
    criadaEm: iso(r.criada_em)!,
    atualizadaEm: iso(r.atualizada_em)!,
    enviadaEm: iso(r.enviada_em),
    abertaEm: iso(r.aberta_em),
    aberturas: Number(r.aberturas) || 0,
    aceite: r.aceite || null,
    recusadaEm: iso(r.recusada_em),
  };
}

function aleatorio(bytes: number): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, bytes * 2);
}

// ------------------------------------------------------------- tabela

export async function tabelaAtual(): Promise<Tabela> {
  const sql = await db();
  const [r] = await sql`select tabela from configuracoes where id = 1`;
  return r ? tabelaCompleta(r.tabela) : TABELA_PADRAO;
}

export async function salvarTabela(t: Tabela): Promise<void> {
  const sql = await db();
  const limpa = tabelaCompleta(t);
  await sql`
    insert into configuracoes (id, tabela) values (1, ${sql.json(limpa as never)})
    on conflict (id) do update set tabela = excluded.tabela, atualizada_em = now()
  `;
}

// ----------------------------------------------------------- propostas

export async function listarPropostas(): Promise<Proposta[]> {
  const sql = await db();
  const r = await sql`select * from propostas order by atualizada_em desc limit 500`;
  return r.map(daLinha);
}

export async function buscarProposta(id: string): Promise<Proposta | null> {
  const sql = await db();
  const [r] = await sql`select * from propostas where id = ${id}`;
  return r ? daLinha(r) : null;
}

/** a proposta do link público: o token precisa bater */
export async function propostaDoLink(id: string, token: string): Promise<Proposta | null> {
  const p = await buscarProposta(id.slice(0, 40)).catch(() => null);
  return p && p.token === token ? p : null;
}

/**
 * Cria ou atualiza. A tabela de preços é copiada para dentro da proposta a
 * cada salvamento: mudar os preços nas Configurações não mexe em proposta
 * que já foi mandada e não foi editada de novo.
 */
export async function salvarProposta(id: string | null, dados: DadosProposta): Promise<{ id: string; token: string }> {
  const sql = await db();
  const tabela = await tabelaAtual();
  const limpos = dadosValidos(dados);
  if (id) {
    const r = await sql`
      update propostas set dados = ${sql.json(limpos as never)}, tabela = ${sql.json(tabela as never)}, atualizada_em = now()
      where id = ${id} returning id, token
    `;
    if (r.length) return { id, token: r[0].token as string };
  }
  const novo = { id: aleatorio(5), token: aleatorio(8) };
  await sql`
    insert into propostas (id, token, dados, tabela)
    values (${novo.id}, ${novo.token}, ${sql.json(limpos as never)}, ${sql.json(tabela as never)})
  `;
  return novo;
}

export async function duplicarProposta(id: string): Promise<string | null> {
  const p = await buscarProposta(id);
  if (!p) return null;
  return (await salvarProposta(null, { ...p.dados, cliente: { ...p.dados.cliente } })).id;
}

export async function apagarProposta(id: string): Promise<void> {
  const sql = await db();
  await sql`delete from propostas where id = ${id}`;
}

/** você copiou o link ou abriu o WhatsApp: rascunho vira enviada */
export async function marcarEnviada(id: string): Promise<void> {
  const sql = await db();
  await sql`
    update propostas set enviada_em = coalesce(enviada_em, now()),
      status = case when status = 'rascunho' then 'enviada' else status end
    where id = ${id}
  `;
}

export async function marcarStatus(id: string, status: 'recusada' | 'reabrir'): Promise<void> {
  const sql = await db();
  if (status === 'recusada') {
    await sql`update propostas set status = 'recusada', recusada_em = now() where id = ${id}`;
  } else {
    await sql`
      update propostas set recusada_em = null, aceite = null,
        status = case when aberta_em is not null then 'aberta' when enviada_em is not null then 'enviada' else 'rascunho' end
      where id = ${id}
    `;
  }
}

/** o cliente abriu o link (não conta você, nem o robô que monta a prévia no WhatsApp) */
export async function marcarAberta(id: string): Promise<void> {
  const sql = await db();
  await sql`
    update propostas set aberta_em = coalesce(aberta_em, now()), aberturas = aberturas + 1,
      status = case when status in ('rascunho', 'enviada') then 'aberta' else status end
    where id = ${id}
  `;
}

export async function registrarAceite(id: string, nome: string): Promise<boolean> {
  const sql = await db();
  const r = await sql`
    update propostas set aceite = ${sql.json({ nome, em: new Date().toISOString() })}, status = 'aceita', recusada_em = null
    where id = ${id} and aceite is null returning id
  `;
  return r.length > 0;
}

/** limite de tentativas por chave (login, aceite): true = passou do limite */
export async function estourou(chave: string, max: number, minutos: number): Promise<boolean> {
  const sql = await db();
  await sql`delete from tentativas where em < now() - interval '1 day'`;
  const [r] = await sql`select count(*)::int as n from tentativas where chave = ${chave} and em > now() - make_interval(mins => ${minutos})`;
  if ((r.n as number) >= max) return true;
  await sql`insert into tentativas (chave) values (${chave})`;
  return false;
}
