/**
 * Quem não entrou vai para /login. A proposta do cliente (/p/...) e a tela
 * de entrar ficam abertas. Cada página e cada ação conferem a sessão de
 * novo no servidor; isto aqui só evita mostrar o painel vazio.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, sessaoValida } from '@/lib/sessao';

const ABERTAS = ['/login', '/p/', '/api/p/'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ABERTAS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (await sessaoValida(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname === '/' ? '' : `?volta=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/|img/|favicon|icon|apple-icon|robots.txt).*)'],
};
