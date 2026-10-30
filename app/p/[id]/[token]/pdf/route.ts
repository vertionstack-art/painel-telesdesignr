import { propostaDoLink } from '@/lib/dados';
import { gerarPdf } from '@/lib/pdf';
import { calcular, tituloDa } from '@/lib/precos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string; token: string }> };

/** a proposta em PDF, como arquivo "Proposta - <cliente>.pdf" */
export async function GET(req: Request, ctx: Ctx) {
  const { id, token } = await ctx.params;
  const p = await propostaDoLink(id, token);
  if (!p || !calcular(p.dados, p.tabela).linhas.length) return new Response('Proposta não encontrada.', { status: 404 });

  const origem = new URL(req.url).origin;
  const pdf = await gerarPdf(p, `${origem}/p/${p.id}/${p.token}`);
  const nome = `Proposta - ${tituloDa(p.dados)}`.replace(/[\/:*?"<>|]+/g, ' ').trim().slice(0, 120);
  const ascii = nome.normalize('NFD').replace(/[^\x20-\x7e]/g, '');
  // ?ver=1 abre no navegador; sem ele, baixa o arquivo
  const modo = new URL(req.url).searchParams.has('ver') ? 'inline' : 'attachment';
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${modo}; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(nome)}.pdf`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
