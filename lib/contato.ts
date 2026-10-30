/** os contatos da landing (telesdesignr/index.html) */
export const CONTATO = {
  nome: 'Teles Designr',
  whatsapp: '5521960194636',
  telefone: '(21) 96019-4636',
  instagram: 'teles.designr',
  cidade: 'Rio de Janeiro, RJ',
  desde: 2014,
  site: 'telesdesignr.com',
};

export function linkWhats(texto: string): string {
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(texto)}`;
}
