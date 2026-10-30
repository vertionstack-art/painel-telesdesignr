'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  apagarProposta,
  duplicarProposta,
  exigirSessao,
  marcarEnviada,
  marcarStatus,
  salvarProposta,
  salvarTabela,
} from '@/lib/dados';
import { tabelaCompleta, type DadosProposta, type Tabela } from '@/lib/precos';

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
