/** formatos de data e telefone usados no painel e na proposta (roda nos dois lados) */

export function haQuanto(isoData: string, agora = Date.now()): string {
  const min = Math.round((agora - new Date(isoData).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  const dias = Math.round(min / 1440);
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  return new Date(isoData).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });
}

export function dataLonga(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}

export function dataHora(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

/** número para o wa.me: só dígitos, com 55 na frente quando vier sem o país */
export function numeroWa(tel: string): string | null {
  const d = tel.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

/** o primeiro nome, para cumprimentar */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || '';
}
