'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  estourou,
  apagarProposta,
  duplicarProposta,
  exigirSessao,
  marcarEnviada,
  marcarStatus,
  salvarProposta,
  salvarTabela,
} from '@/lib/dados';
import { calcular, tabelaCompleta, type DadosProposta, type Tabela } from '@/lib/precos';
import { ErroRecado, gerarRecado } from '@/lib/recado';

const idLimpo = (id: unknown) => String(id ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 40);

export async function salvar(id: string | null, dados: DadosProposta): Promise<{ ok: true; id: string; token: string } | { ok: false; erro: string }> {
  await exigirSessao();
  try {
    const r = await salvarProposta(id ? idLimpo(id) : null, dados);
    revalidatePath('/');
    return { ok: true, ...r };
  } catch (e) {
    console.error('[salvar]', e);
    return { ok: false, erro: 'Não consegui salvar. Confira a internet e tente de novo.' };
  }
}

export async function enviada(id: string): Promise<void> {
  await exigirSessao();
  await marcarEnviada(idLimpo(id));
  revalidatePath('/');
}

export async function mudarStatus(id: string, status: 'recusada' | 'reabrir'): Promise<void> {
  await exigirSessao();
  await marcarStatus(idLimpo(id), status);
  revalidatePath('/');
  revalidatePath(`/propostas/${idLimpo(id)}`);
}

export async function duplicar(id: string): Promise<void> {
  await exigirSessao();
  const novo = await duplicarProposta(idLimpo(id));
  revalidatePath('/');
  redirect(novo ? `/propostas/${novo}` : '/');
}

export async function apagar(id: string): Promise<void> {
  await exigirSessao();
  await apagarProposta(idLimpo(id));
  revalidatePath('/');
  redirect('/');
}

export async function salvarPrecos(t: Tabela): Promise<{ ok: boolean; erro?: string }> {
  await exigirSessao();
  try {
    await salvarTabela(tabelaCompleta(t));
    revalidatePath('/configuracoes');
    return { ok: true };
  } catch (e) {
    console.error('[precos]', e);
    return { ok: false, erro: 'Não consegui salvar os preços. Tente de novo.' };
  }
}

/**
 * O botão "Gerar recado com IA". A chave da Anthropic só existe aqui no
 * servidor; o navegador manda o rascunho e recebe o texto pronto, nada mais.
 */
export async function recadoComIa(rascunho: string, dados: DadosProposta, tabela: Tabela): Promise<{ ok: true; texto: string } | { ok: false; erro: string }> {
  await exigirSessao();
  const texto = String(rascunho ?? '').trim().slice(0, 1500);
  if (texto.length < 8) return { ok: false, erro: 'Escreva primeiro, do seu jeito, o que quer dizer ao cliente.' };
  // mesmo logado, um teto por hora: se alguém pegar sua sessão, não queima a conta
  if (await estourou('recado-ia', 40, 60)) return { ok: false, erro: 'Muitos recados na última hora. Espere um pouco.' };
  try {
    const conta = calcular(dados, tabelaCompleta(tabela));
    const r = await gerarRecado(texto, {
      cliente: String(dados?.cliente?.nome ?? '').slice(0, 120),
      negocio: String(dados?.cliente?.negocio ?? '').slice(0, 160),
      servicos: conta.linhas.map((l) => l.nome).slice(0, 20),
      prazo: String(dados?.prazo ?? '').slice(0, 300),
    });
    return { ok: true, texto: r };
  } catch (e) {
    return { ok: false, erro: e instanceof ErroRecado ? e.message : 'A IA não respondeu agora. Tente de novo.' };
  }
}
