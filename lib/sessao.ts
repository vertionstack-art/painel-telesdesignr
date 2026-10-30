/**
 * Login de uma senha só. A senha mora na variável PAINEL_SENHA da Vercel; o
 * cookie guarda uma assinatura derivada dela (nunca a senha). Trocar a senha
 * na Vercel derruba todas as sessões abertas.
 *
 * Usa a Web Crypto para rodar igual no proxy e nas páginas.
 */

export const COOKIE = 'td_sessao';
export const DIAS_SESSAO = 30;

const enc = new TextEncoder();

async function hmac(chave: string, texto: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(chave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(texto));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function senhaConfigurada(): boolean {
  return (process.env.PAINEL_SENHA || '').length >= 6;
}

/** o valor do cookie de quem entrou */
export async function marcaDaSessao(): Promise<string> {
  return hmac(process.env.PAINEL_SENHA || '', 'painel-telesdesignr:sessao:v1');
}

/** compara sem vazar pelo tempo de resposta */
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function sessaoValida(valor: string | undefined): Promise<boolean> {
  if (!valor || !senhaConfigurada()) return false;
  return iguais(valor, await marcaDaSessao());
}

export async function senhaConfere(digitada: string): Promise<boolean> {
  if (!senhaConfigurada()) return false;
  // compara as assinaturas, não os textos: mesmo tamanho sempre
  const [a, b] = await Promise.all([hmac('cmp', digitada), hmac('cmp', process.env.PAINEL_SENHA || '')]);
  return iguais(a, b);
}
