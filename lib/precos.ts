/**
 * A tabela de preços e a conta da proposta.
 *
 * Os valores de fábrica são os mesmos do simulador da landing
 * (telesdesignr/index.html, bloco PRECOS): o que o cliente viu no site é o
 * que a proposta cobra. Depois disso, quem manda é a tela de Configurações.
 *
 * Roda no navegador (a prévia ao vivo do editor) e no servidor (a página
 * que o cliente abre), então não pode importar nada de banco.
 */

export type PerfilId = 'pf' | 'mei' | 'ong' | 'pequena' | 'media' | 'grande';
export type IdentidadeId = 'basica' | 'media' | 'completa';

export interface Tabela {
  perfis: Record<PerfilId, { nome: string; k: number }>;
  identidade: Record<IdentidadeId, { nome: string; v: number; detalhe: string; aPartir?: boolean }>;
  /** quantidade -> preço */
  artes: Record<string, number>;
  videos: Record<string, number>;
  redes: { planos: Record<string, number>; carrossel: number; reels: number };
  /** gravação no local: valor fixo por dia, fora do ajuste de perfil e do combo */
  diaria: number;
  /** desconto quando há dois serviços ou mais (0.10 = 10%) */
  combo: number;
  parcelas: number;
  /** desconto para quem paga à vista no Pix (0.05 = 5%) */
  pix: number;
}

export const TABELA_PADRAO: Tabela = {
  perfis: {
    pf: { nome: 'Pessoa física', k: 1 },
    mei: { nome: 'MEI', k: 1 },
    ong: { nome: 'Igreja / ONG', k: 1 },
    pequena: { nome: 'Pequena empresa (ME/EPP)', k: 1.15 },
    media: { nome: 'Média empresa', k: 1.35 },
    grande: { nome: 'Grande empresa', k: 1.6 },
  },
  identidade: {
    basica: { nome: 'Básica', v: 327.97, detalhe: 'Logo, paleta de cores e tipografia' },
    media: { nome: 'Média', v: 653.87, detalhe: 'Logo, paleta e tipografia, mais aplicações e mockups' },
    completa: { nome: 'Completa', v: 1037.97, detalhe: 'Marca inteira, sob medida', aPartir: true },
  },
  artes: { 5: 317.97, 10: 437.89, 20: 1047.93 },
  videos: { 4: 427.97, 8: 737.89, 12: 1067.93 },
  redes: { planos: { 2: 397.89, 3: 557.93, 5: 1297.97 }, carrossel: 177.93, reels: 97.89 },
  diaria: 257.97,
  combo: 0.1,
  parcelas: 12,
  pix: 0.05,
};

export const PERFIS = Object.keys(TABELA_PADRAO.perfis) as PerfilId[];
export const IDENTIDADES = Object.keys(TABELA_PADRAO.identidade) as IdentidadeId[];

/** o que foi marcado para o cliente; serviço ausente = não entra */
export interface Servicos {
  identidade?: IdentidadeId | null;
  artes?: string | null;
  videos?: string | null;
  redes?: { plano: string; carrossel: number; reels: number } | null;
  captacao?: { dias: number } | null;
}

/** serviço digitado na hora (site pela Vertion Stack, cardápio, fachada…): vale o preço digitado */
export interface ItemLivre {
  id: string;
  nome: string;
  detalhe: string;
  valor: number;
  mensal: boolean;
}

export interface FormasPagamento {
  metade: boolean;
  parcelado: boolean;
  pix: boolean;
}

export interface Cliente {
  nome: string;
  negocio: string;
  perfil: PerfilId;
  whatsapp: string;
  email: string;
  instagram: string;
  cidade: string;
}

export interface DadosProposta {
  cliente: Cliente;
  servicos: Servicos;
  livres: ItemLivre[];
  /** desconto a mais, em %, sobre tudo */
  desconto: number;
  pagamento: FormasPagamento;
  /** texto livre: a mensagem de abertura para o cliente */
  mensagem: string;
  /** texto livre: prazo de entrega */
  prazo: string;
  /** valor combinado na conversa: substitui o calculado */
  manualUnico: number | null;
  manualMensal: number | null;
}

export const CLIENTE_VAZIO: Cliente = { nome: '', negocio: '', perfil: 'pf', whatsapp: '', email: '', instagram: '', cidade: '' };

export const PROPOSTA_VAZIA: DadosProposta = {
  cliente: CLIENTE_VAZIO,
  servicos: {},
  livres: [],
  desconto: 0,
  pagamento: { metade: true, parcelado: true, pix: true },
  mensagem: '',
  prazo: '',
  manualUnico: null,
  manualMensal: null,
};

export interface Linha {
  chave: string;
  nome: string;
  detalhe: string;
  valor: number;
  mensal: boolean;
  /** fora do ajuste de perfil e do combo */
  fixo: boolean;
  aPartir: boolean;
}

export interface Conta {
  linhas: Linha[];
  perfil: { nome: string; k: number };
  combo: boolean;
  unico: Bloco | null;
  mensal: Bloco | null;
  aPartir: boolean;
}

export interface Bloco {
  subtotal: number;
  /** desconto do combo (valor em R$) */
  combo: number;
  /** desconto a mais (valor em R$) */
  extra: number;
  total: number;
  /** o calculado, antes de um valor digitado à mão */
  calculado: number;
  manual: boolean;
  parcela: number;
  pix: number;
}

/** nunca termina em ,00 — o mesmo arredondamento da landing */
export function quebrado(v: number): number {
  let c = Math.round(v * 100);
  if (c > 0 && c % 100 === 0) c -= 3;
  return c / 100;
}

const centavos = (v: number) => Math.round(v * 100) / 100;

export function moeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** as linhas da proposta, já com o ajuste de perfil, na ordem do simulador */
export function linhasDa(d: DadosProposta, t: Tabela): { linhas: Linha[]; perfil: { nome: string; k: number } } {
  const perfil = t.perfis[d.cliente.perfil] || t.perfis.pf;
  const s = d.servicos;
  const brutas: (Omit<Linha, 'valor'> & { v: number })[] = [];
  const add = (l: Omit<Linha, 'valor'> & { v: number }) => brutas.push(l);

  if (s.identidade && t.identidade[s.identidade]) {
    const p = t.identidade[s.identidade];
    add({ chave: 'identidade', nome: `Identidade visual ${p.nome}`, detalhe: p.detalhe, v: p.v, mensal: false, fixo: false, aPartir: Boolean(p.aPartir) });
  }
  if (s.artes && t.artes[s.artes] != null) {
    add({ chave: 'artes', nome: `Pacote de ${s.artes} artes`, detalhe: 'Posts, carrosséis, flyers e banners', v: t.artes[s.artes], mensal: false, fixo: false, aPartir: false });
  }
  if (s.videos && t.videos[s.videos] != null) {
    add({ chave: 'videos', nome: `Pacote de ${s.videos} vídeos`, detalhe: 'Vídeos institucionais e Reels com legenda', v: t.videos[s.videos], mensal: false, fixo: false, aPartir: false });
  }
  if (s.redes && t.redes.planos[s.redes.plano] != null) {
    const car = Math.max(0, Math.floor(s.redes.carrossel || 0));
    const ree = Math.max(0, Math.floor(s.redes.reels || 0));
    const det = [`${s.redes.plano} posts por semana`];
    let v = t.redes.planos[s.redes.plano];
    if (car) {
      v += car * t.redes.carrossel;
      det.push(`${car} ${car > 1 ? 'carrosséis' : 'carrossel'} no mês`);
    }
    if (ree) {
      v += ree * t.redes.reels;
      det.push(`${ree} ${ree > 1 ? 'Reels editados' : 'Reels editado'} no mês`);
    }
    add({ chave: 'redes', nome: 'Gestão de redes', detalhe: `Planejamento, artes, legendas e postagem: ${det.join(', ')}`, v, mensal: true, fixo: false, aPartir: false });
  }
  if (s.captacao) {
    const dias = Math.max(1, Math.floor(s.captacao.dias || 1));
    add({ chave: 'captacao', nome: 'Gravação no local', detalhe: `Captação presencial no Rio de Janeiro: ${dias} ${dias > 1 ? 'dias' : 'dia'}`, v: dias * t.diaria, mensal: false, fixo: true, aPartir: false });
  }

  const linhas: Linha[] = brutas.map(({ v, ...l }) => ({ ...l, valor: quebrado(l.fixo ? v : v * perfil.k) }));
  for (const it of d.livres) {
    if (!it.nome.trim() || !(it.valor > 0)) continue;
    linhas.push({ chave: `livre:${it.id}`, nome: it.nome.trim(), detalhe: it.detalhe.trim(), valor: centavos(it.valor), mensal: it.mensal, fixo: true, aPartir: false });
  }
  return { linhas, perfil };
}

/**
 * A conta inteira. O combo vale com dois serviços do catálogo ou mais e não
 * desconta a diária de gravação nem os itens livres (o preço digitado já é o
 * combinado). O desconto a mais vale sobre o que sobrou.
 */
export function calcular(d: DadosProposta, t: Tabela): Conta {
  const { linhas, perfil } = linhasDa(d, t);
  const doCatalogo = linhas.filter((l) => !l.chave.startsWith('livre:'));
  const combo = doCatalogo.length >= 2;
  const extraPct = Math.min(Math.max(d.desconto || 0, 0), 90) / 100;

  const bloco = (lst: Linha[], manual: number | null): Bloco | null => {
    if (!lst.length) return null;
    const subtotal = centavos(lst.reduce((s, l) => s + l.valor, 0));
    const comboV = combo ? centavos(lst.filter((l) => !l.fixo && !l.chave.startsWith('livre:')).reduce((s, l) => s + l.valor, 0) * t.combo) : 0;
    const extra = centavos((subtotal - comboV) * extraPct);
    const calculado = quebrado(subtotal - comboV - extra);
    const usaManual = manual != null && manual > 0;
    const total = usaManual ? centavos(manual) : calculado;
    return {
      subtotal,
      combo: comboV,
      extra,
      total,
      calculado,
      manual: usaManual,
      parcela: Math.ceil((total / t.parcelas) * 100) / 100,
      pix: quebrado(total * (1 - t.pix)),
    };
  };

  return {
    linhas,
    perfil,
    combo,
    unico: bloco(linhas.filter((l) => !l.mensal), d.manualUnico),
    mensal: bloco(linhas.filter((l) => l.mensal), d.manualMensal),
    aPartir: linhas.some((l) => l.aPartir),
  };
}

/** junta o que veio do banco com os valores de fábrica: chave nova nunca chega vazia */
export function tabelaCompleta(x: unknown): Tabela {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<Tabela>;
  const p = TABELA_PADRAO;
  return {
    perfis: { ...p.perfis, ...(o.perfis || {}) },
    identidade: { ...p.identidade, ...(o.identidade || {}) },
    artes: o.artes && Object.keys(o.artes).length ? o.artes : p.artes,
    videos: o.videos && Object.keys(o.videos).length ? o.videos : p.videos,
    redes: { ...p.redes, ...(o.redes || {}), planos: o.redes?.planos && Object.keys(o.redes.planos).length ? o.redes.planos : p.redes.planos },
    diaria: num(o.diaria, p.diaria),
    combo: num(o.combo, p.combo),
    parcelas: Math.max(1, Math.floor(num(o.parcelas, p.parcelas))),
    pix: num(o.pix, p.pix),
  };
}

function num(v: unknown, padrao: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : padrao;
}

/** o que chegou do navegador vira uma proposta válida (nada de campo estranho no banco) */
export function dadosValidos(x: unknown): DadosProposta {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<DadosProposta>;
  const c = (o.cliente || {}) as Partial<Cliente>;
  const txt = (v: unknown, max: number) => String(v ?? '').slice(0, max);
  const s = (o.servicos || {}) as Servicos;
  const perfil = PERFIS.includes(c.perfil as PerfilId) ? (c.perfil as PerfilId) : 'pf';
  const valorOuNull = (v: unknown) => {
    const n = Number(v);
    return v == null || v === '' || !Number.isFinite(n) || n <= 0 ? null : Math.min(n, 10_000_000);
  };
  return {
    cliente: {
      nome: txt(c.nome, 120),
      negocio: txt(c.negocio, 160),
      perfil,
      whatsapp: txt(c.whatsapp, 40),
      email: txt(c.email, 160),
      instagram: txt(c.instagram, 80),
      cidade: txt(c.cidade, 120),
    },
    servicos: {
      identidade: IDENTIDADES.includes(s.identidade as IdentidadeId) ? s.identidade : null,
      artes: s.artes ? txt(s.artes, 6) : null,
      videos: s.videos ? txt(s.videos, 6) : null,
      redes: s.redes
        ? { plano: txt(s.redes.plano, 6), carrossel: inteiro(s.redes.carrossel, 0, 50), reels: inteiro(s.redes.reels, 0, 50) }
        : null,
      captacao: s.captacao ? { dias: inteiro(s.captacao.dias, 1, 30) } : null,
    },
    livres: (Array.isArray(o.livres) ? o.livres : []).slice(0, 30).map((it, i) => ({
      id: txt(it?.id, 40) || `i${i}`,
      nome: txt(it?.nome, 120),
      detalhe: txt(it?.detalhe, 300),
      valor: Math.min(Math.max(Number(it?.valor) || 0, 0), 10_000_000),
      mensal: Boolean(it?.mensal),
    })),
    desconto: Math.min(Math.max(Number(o.desconto) || 0, 0), 90),
    pagamento: {
      metade: o.pagamento?.metade !== false,
      parcelado: o.pagamento?.parcelado !== false,
      pix: o.pagamento?.pix !== false,
    },
    mensagem: txt(o.mensagem, 2000),
    prazo: txt(o.prazo, 300),
    manualUnico: valorOuNull(o.manualUnico),
    manualMensal: valorOuNull(o.manualMensal),
  };
}

function inteiro(v: unknown, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(Number(v) || 0), min), max);
}

/** o nome que aparece no título: o negócio, ou a pessoa */
export function tituloDa(d: DadosProposta): string {
  return d.cliente.negocio.trim() || d.cliente.nome.trim() || 'Cliente sem nome';
}
