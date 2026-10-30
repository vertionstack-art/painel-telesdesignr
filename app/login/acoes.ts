'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, DIAS_SESSAO, marcaDaSessao, senhaConfere } from '@/lib/sessao';
import { estourou } from '@/lib/dados';

export async function entrar(_antes: { erro: string } | null, form: FormData): Promise<{ erro: string } | null> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (await estourou(`login:${ip}`, 8, 15)) return { erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' };

  if (!(await senhaConfere(String(form.get('senha') || '')))) return { erro: 'Senha errada.' };

  const c = await cookies();
  c.set(COOKIE, await marcaDaSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * DIAS_SESSAO,
  });
  const volta = String(form.get('volta') || '/');
  redirect(volta.startsWith('/') && !volta.startsWith('//') ? volta : '/');
}

export async function sair() {
  const c = await cookies();
  c.delete(COOKIE);
  redirect('/login');
}
