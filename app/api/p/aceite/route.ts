import { NextResponse } from 'next/server';
import { estourou, propostaDoLink, registrarAceite } from '@/lib/dados';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** o cliente aceitou a proposta: { id, token, nome } */
export async function POST(req: Request) {
  // só aceita vindo da própria página da proposta
  const origem = req.headers.get('origin');
  if (origem && new URL(origem).host !== new URL(req.url).host) {
    return NextResponse.json({ ok: false, erro: 'Pedido recusado.' }, { status: 403 });
  }
  const corpo = (await req.json().catch(() => ({}))) as { id?: string; token?: string; nome?: string };
  const nome = String(corpo.nome || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (nome.length < 3) return NextResponse.json({ ok: false, erro: 'Escreva seu nome completo.' }, { status: 400 });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (await estourou(`aceite:${ip}`, 10, 60)) {
    return NextResponse.json({ ok: false, erro: 'Muitas tentativas. Tente de novo mais tarde.' }, { status: 429 });
  }

  const p = await propostaDoLink(String(corpo.id || ''), String(corpo.token || ''));
  if (!p) return NextResponse.json({ ok: false, erro: 'Proposta não encontrada.' }, { status: 404 });
  if (p.status === 'recusada') return NextResponse.json({ ok: false, erro: 'Esta proposta foi encerrada. Fale comigo no WhatsApp.' }, { status: 409 });
  if (p.aceite) return NextResponse.json({ ok: true, aceite: p.aceite });

  await registrarAceite(p.id, nome);
  return NextResponse.json({ ok: true, aceite: { nome, em: new Date().toISOString() } });
}
