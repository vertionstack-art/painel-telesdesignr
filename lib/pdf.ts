/**
 * A proposta em PDF de verdade (arquivo para baixar e mandar no WhatsApp),
 * no visual da página: faixa escura com a foto e o nome do cliente em roxo,
 * depois os serviços, o investimento, as formas de pagamento e o contato.
 *
 * Gerado no servidor com pdf-lib. As fontes (Archivo e Plus Jakarta Sans,
 * licença OFL) e a foto ficam em lib/pdf-assets e entram no pacote da Vercel
 * pelo outputFileTracingIncludes do next.config.
 */

import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFName, PDFString, degrees, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import type { Proposta } from './dados';
import { calcular, moeda, tituloDa } from './precos';
import { dataLonga, primeiroNome } from './formato';
import { CONTATO } from './contato';

const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const COR = {
  noite: hex('#070707'),
  tinta: hex('#0b0a0e'),
  roxo: hex('#8b2cff'),
  roxo2: hex('#a95cff'),
  lilas: hex('#d9c2ff'),
  lilasClaro: hex('#ece3ff'),
  roxoEscuro: hex('#4a1d96'),
  cinzaHero: hex('#a8a0bb'),
  textoHero: hex('#d4cde2'),
  papel2: hex('#efeaf8'),
  linha: hex('#e3deec'),
  texto2: hex('#4c4560'),
  texto3: hex('#6f6880'),
  verde: hex('#1b8a45'),
  verdeClaro: hex('#e3f5ea'),
  branco: rgb(1, 1, 1),
};

const A4: [number, number] = [595.28, 841.89];
const M = 44; // margem
const LARGURA = A4[0] - M * 2;

const ASSETS = path.join(process.cwd(), 'lib', 'pdf-assets');
const ler = (n: string) => readFile(path.join(ASSETS, n));

interface Fontes {
  titulo: PDFFont;
  tituloForte: PDFFont;
  texto: PDFFont;
  semi: PDFFont;
  negrito: PDFFont;
  extra: PDFFont;
}

/** troca o que a fonte não tem (emoji, símbolos raros) para não sair quadradinho */
function seguro(f: PDFFont, t: string): string {
  const tem = new Set(f.getCharacterSet());
  return Array.from(t.replace(/[−–]/g, '-').replace(/[​-‍️]/g, ''))
    .map((c) => (c === '\n' || tem.has(c.codePointAt(0)!) ? c : ''))
    .join('');
}

/** quebra o texto em linhas que cabem na largura */
function linhas(f: PDFFont, t: string, tam: number, largura: number): string[] {
  const saida: string[] = [];
  for (const par of seguro(f, t).split('\n')) {
    let atual = '';
    for (const palavra of par.split(/\s+/).filter(Boolean)) {
      const tenta = atual ? `${atual} ${palavra}` : palavra;
      if (f.widthOfTextAtSize(tenta, tam) <= largura || !atual) atual = tenta;
      else {
        saida.push(atual);
        atual = palavra;
      }
    }
    saida.push(atual);
  }
  return saida;
}

/** o símbolo da placa: triângulo roxo e triângulo claro; y é a base (o SVG desenha para baixo) */
function simbolo(p: PDFPage, x: number, y: number, escala: number, cor2: RGB) {
  const topo = y + 30 * escala;
  p.drawSvgPath('M0 30 L13 4 L20 18 Z', { x, y: topo, scale: escala, color: COR.roxo });
  p.drawSvgPath('M15 30 L26 8 L34 30 Z', { x, y: topo, scale: escala, color: cor2 });
}

/** link clicável sobre um retângulo da página */
function link(doc: PDFDocument, p: PDFPage, url: string, x: number, y: number, w: number, h: number) {
  const anotacao = doc.context.register(
    doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [x, y, x + w, y + h],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    }),
  );
  const atuais = p.node.lookup(PDFName.of('Annots'));
  if (atuais && 'push' in atuais) (atuais as unknown as { push: (x: unknown) => void }).push(anotacao);
  else p.node.set(PDFName.of('Annots'), doc.context.obj([anotacao]));
}

export async function gerarPdf(p: Proposta, urlProposta: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [a7, a8, j4, j6, j7, j8, foto] = await Promise.all([
    ler('archivo-latin-700-normal.woff'),
    ler('archivo-latin-800-normal.woff'),
    ler('plus-jakarta-sans-latin-400-normal.woff'),
    ler('plus-jakarta-sans-latin-600-normal.woff'),
    ler('plus-jakarta-sans-latin-700-normal.woff'),
    ler('plus-jakarta-sans-latin-800-normal.woff'),
    ler('teles-designr.jpg'),
  ]);
  const F: Fontes = {
    titulo: await doc.embedFont(a7, { subset: true }),
    tituloForte: await doc.embedFont(a8, { subset: true }),
    texto: await doc.embedFont(j4, { subset: true }),
    semi: await doc.embedFont(j6, { subset: true }),
    negrito: await doc.embedFont(j7, { subset: true }),
    extra: await doc.embedFont(j8, { subset: true }),
  };
  const imagem = await doc.embedJpg(foto);

  const d = p.dados;
  const conta = calcular(d, p.tabela);
  const titulo = tituloDa(d);
  doc.setTitle(`Proposta - ${titulo}`);
  doc.setAuthor(CONTATO.nome);
  doc.setSubject(`Proposta comercial para ${titulo}`);
  doc.setCreator('Painel Teles Designr');

  let pagina = doc.addPage(A4);
  let y = A4[1];

  // texto simples numa posição; devolve a largura usada
  const escreve = (pg: PDFPage, t: string, x: number, yy: number, f: PDFFont, tam: number, cor: RGB) => {
    const s = seguro(f, t);
    pg.drawText(s, { x, y: yy, size: tam, font: f, color: cor });
    return f.widthOfTextAtSize(s, tam);
  };
  const aDireita = (pg: PDFPage, t: string, xDir: number, yy: number, f: PDFFont, tam: number, cor: RGB) => {
    const s = seguro(f, t);
    pg.drawText(s, { x: xDir - f.widthOfTextAtSize(s, tam), y: yy, size: tam, font: f, color: cor });
  };

  /** página nova quando o que vem não cabe; as seguintes têm só um cabeçalho fino */
  const cabe = (altura: number) => {
    if (y - altura >= 56) return;
    pagina = doc.addPage(A4);
    pagina.drawRectangle({ x: 0, y: A4[1] - 46, width: A4[0], height: 46, color: COR.noite });
    simbolo(pagina, M, A4[1] - 29, 0.5, COR.branco);
    escreve(pagina, 'TELES DESIGNR', M + 24, A4[1] - 28, F.titulo, 10, COR.branco);
    aDireita(pagina, `Proposta para ${titulo}`, A4[0] - M, A4[1] - 28, F.semi, 9, COR.cinzaHero);
    y = A4[1] - 80;
  };

  // ------------------------------------------------------------- topo escuro
  const nomeLinhas = (() => {
    // o nome encolhe até caber em no máximo 3 linhas na coluna do texto
    const colNome = LARGURA - 150;
    for (const tam of [44, 38, 32, 27, 23]) {
      const l = linhas(F.tituloForte, titulo.toUpperCase(), tam, colNome);
      if (l.length <= 3) return { l, tam };
    }
    return { l: linhas(F.tituloForte, titulo.toUpperCase(), 20, colNome), tam: 20 };
  })();
  const recado =
    d.mensagem.trim() || 'Montei esta proposta com o que conversamos. Abaixo está cada serviço, o que vem incluso e quanto fica. Qualquer dúvida, é só me chamar.';
  const nomePessoa = primeiroNome(d.cliente.nome);
  const recadoLinhas = linhas(F.texto, `${nomePessoa ? `Oi, ${nomePessoa}! ` : ''}${recado}`, 10.5, LARGURA - 170);
  const alturaTopo = 150 + nomeLinhas.l.length * nomeLinhas.tam * 0.95 + recadoLinhas.length * 15.5 + 34;

  pagina.drawRectangle({ x: 0, y: A4[1] - alturaTopo, width: A4[0], height: alturaTopo, color: COR.noite });
  // foto à direita, ocupando a altura da faixa (fundo preto da foto some no escuro)
  const altFoto = Math.min(alturaTopo - 20, 300);
  const largFoto = (imagem.width / imagem.height) * altFoto;
  pagina.drawImage(imagem, { x: A4[0] - largFoto + 30, y: A4[1] - alturaTopo, width: largFoto, height: altFoto, opacity: 0.85 });

  simbolo(pagina, M, A4[1] - 47, 0.62, COR.branco);
  escreve(pagina, 'TELES DESIGNR', M + 29, A4[1] - 45, F.titulo, 12, COR.branco);
  aDireita(pagina, dataLonga(p.atualizadaEm), A4[0] - M, A4[1] - 42, F.negrito, 9.5, COR.branco);
  aDireita(pagina, `Rio de Janeiro · desde ${CONTATO.desde}`, A4[0] - M, A4[1] - 55, F.texto, 8.5, COR.cinzaHero);

  y = A4[1] - 118;
  escreve(pagina, 'PROPOSTA PARA', M, y, F.titulo, 17, COR.cinzaHero);
  y -= 10;
  for (const l of nomeLinhas.l) {
    y -= nomeLinhas.tam * 0.95;
    escreve(pagina, l, M, y, F.tituloForte, nomeLinhas.tam, COR.roxo);
  }
  y -= 26;
  recadoLinhas.forEach((l, i) => {
    // o "Oi, Fulano!" em branco e negrito, o resto no cinza claro
    if (i === 0 && nomePessoa) {
      const oi = `Oi, ${nomePessoa}! `;
      if (l.startsWith(seguro(F.texto, oi).trim())) {
        const w = escreve(pagina, oi, M, y, F.extra, 10.5, COR.branco);
        escreve(pagina, l.slice(oi.length), M + w, y, F.texto, 10.5, COR.textoHero);
        y -= 15.5;
        return;
      }
    }
    escreve(pagina, l, M, y, F.texto, 10.5, COR.textoHero);
    y -= 15.5;
  });
  y = A4[1] - alturaTopo - 40;

  // ------------------------------------------------------------- o que você leva
  cabe(60);
  // destaque lilás inclinado atrás de "VOCÊ LEVA", como na página
  escreve(pagina, 'O QUE', M, y, F.tituloForte, 24, COR.tinta);
  y -= 27;
  const wLeva = F.tituloForte.widthOfTextAtSize('VOCÊ LEVA', 24);
  pagina.drawRectangle({ x: M - 3, y: y - 5, width: wLeva + 8, height: 28, color: COR.lilas, rotate: degrees(1.2) });
  escreve(pagina, 'VOCÊ LEVA', M + 1, y, F.tituloForte, 24, COR.tinta);
  y -= 22;

  for (const l of conta.linhas) {
    const det = l.detalhe ? linhas(F.texto, l.detalhe, 9.5, LARGURA - 150) : [];
    const nome = linhas(F.extra, l.nome, 12, LARGURA - 150);
    const alt = 16 + nome.length * 15 + det.length * 13;
    cabe(alt);
    pagina.drawLine({ start: { x: M, y }, end: { x: M + LARGURA, y }, thickness: 0.7, color: COR.linha });
    y -= 22;
    pagina.drawCircle({ x: M + 8, y: y + 4, size: 8, color: COR.roxo });
    pagina.drawSvgPath('M0 4 L3 7 L9 0', { x: M + 4.5, y: y + 8, borderColor: COR.branco, borderWidth: 1.6, scale: 0.85 });
    const valor = `${l.aPartir ? 'a partir de ' : ''}${moeda(l.valor)}${l.mensal ? '/mês' : ''}`;
    aDireita(pagina, valor, M + LARGURA, y, F.negrito, 11, COR.tinta);
    for (const ln of nome) {
      escreve(pagina, ln, M + 26, y, F.extra, 12, COR.tinta);
      y -= 15;
    }
    for (const ln of det) {
      escreve(pagina, ln, M + 26, y, F.texto, 9.5, COR.texto3);
      y -= 13;
    }
  }
  pagina.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + LARGURA, y: y - 4 }, thickness: 0.7, color: COR.linha });
  y -= 20;
  if (d.prazo.trim()) {
    const pz = linhas(F.texto, `Prazo: ${d.prazo.trim()}`, 10, LARGURA);
    cabe(pz.length * 14 + 6);
    for (const ln of pz) {
      escreve(pagina, ln, M, y, F.texto, 10, COR.texto2);
      y -= 14;
    }
    y -= 6;
  }

  // ------------------------------------------------------------- investimento
  const blocos = (['unico', 'mensal'] as const).filter((q) => conta[q]);
  const economia = (conta.unico ? conta.unico.combo + conta.unico.extra : 0) + (conta.mensal ? conta.mensal.combo + conta.mensal.extra : 0);
  const formas = [
    d.pagamento.metade ? '50% na aprovação e 50% na entrega' : null,
    d.pagamento.parcelado && conta.unico ? `Até ${p.tabela.parcelas}x sem juros no cartão` : null,
    d.pagamento.pix && conta.unico ? `Pix à vista com ${Math.round(p.tabela.pix * 100)}% de desconto` : null,
    conta.mensal ? 'Gestão de redes cobrada mês a mês' : null,
  ].filter(Boolean) as string[];
  // altura exata do que vai dentro (título + cada bloco + economia + aviso + formas + respiro)
  const altCaixa = 44 + blocos.length * 70 + (economia > 0 ? 30 : 0) + (conta.aPartir ? 26 : 0) + (formas.length ? 23 + formas.length * 16 : 0) + 6;
  cabe(altCaixa + 10);
  y -= 6;
  const topoCaixa = y;
  pagina.drawRectangle({ x: M, y: topoCaixa - altCaixa, width: LARGURA, height: altCaixa, color: COR.papel2, borderColor: COR.linha, borderWidth: 0.7 });
  y = topoCaixa - 30;
  escreve(pagina, 'Investimento', M + 20, y, F.extra, 15, COR.tinta);
  y -= 14;
  for (const q of blocos) {
    const b = conta[q]!;
    const mes = q === 'mensal';
    y -= 16;
    escreve(pagina, mes ? 'Por mês' : conta.mensal ? 'Pagamento único' : 'Total', M + 20, y, F.negrito, 10, COR.texto2);
    if (b.combo > 0 || b.extra > 0) {
      const sub = moeda(b.subtotal);
      const w = F.texto.widthOfTextAtSize(sub, 9.5);
      escreve(pagina, sub, M + 130, y, F.texto, 9.5, COR.texto3);
      pagina.drawLine({ start: { x: M + 130, y: y + 3.5 }, end: { x: M + 130 + w, y: y + 3.5 }, thickness: 0.8, color: COR.texto3 });
    }
    y -= 30;
    let x = M + 20;
    if (conta.aPartir && !mes) x += escreve(pagina, 'a partir de ', x, y + 2, F.negrito, 10, COR.roxo);
    x += escreve(pagina, moeda(b.total), x, y, F.tituloForte, 28, COR.roxo);
    if (mes) escreve(pagina, '/mês', x + 2, y, F.negrito, 12, COR.roxo);
    const extras = [
      !mes && d.pagamento.parcelado ? `ou ${p.tabela.parcelas}x de ${moeda(b.parcela)} sem juros` : null,
      !mes && d.pagamento.pix ? `ou ${moeda(b.pix)} à vista no Pix` : null,
    ].filter(Boolean) as string[];
    extras.forEach((t, i) => aDireita(pagina, t, M + LARGURA - 20, y + 14 - i * 14, F.negrito, 10, COR.tinta));
    y -= 24;
  }
  if (economia > 0) {
    y -= 8;
    const t = `Você economiza ${moeda(economia)}${conta.combo ? ' com o combo' : ''}`;
    const w = F.extra.widthOfTextAtSize(seguro(F.extra, t), 9.5);
    pagina.drawRectangle({ x: M + 20, y: y - 6, width: w + 20, height: 20, color: COR.verdeClaro });
    escreve(pagina, t, M + 30, y, F.extra, 9.5, COR.verde);
    y -= 22;
  }
  if (conta.aPartir) {
    escreve(pagina, 'A identidade completa varia com o que for pedido. O valor final a gente fecha na conversa.', M + 20, y - 4, F.texto, 8.5, COR.texto3);
    y -= 26;
  }
  if (formas.length) {
    y -= 6;
    escreve(pagina, 'Formas de pagamento', M + 20, y, F.extra, 10.5, COR.tinta);
    y -= 17;
    for (const f of formas) {
      pagina.drawSvgPath('M0 4 L3 7 L9 0', { x: M + 21, y: y + 8, borderColor: COR.roxo, borderWidth: 1.6, scale: 0.85 });
      escreve(pagina, f, M + 36, y, F.texto, 10, COR.texto2);
      y -= 16;
    }
  }
  y = topoCaixa - altCaixa - 26;

  // selos do que a landing promete
  cabe(30);
  let xs = M;
  for (const s of ['Alterações sem custo', 'Atendimento direto comigo']) {
    const w = F.negrito.widthOfTextAtSize(s, 9);
    pagina.drawRectangle({ x: xs, y: y - 6, width: w + 18, height: 20, color: COR.lilasClaro });
    escreve(pagina, s, xs + 9, y, F.negrito, 9, COR.roxoEscuro);
    xs += w + 26;
  }
  y -= 32;

  // ------------------------------------------------------------- como segue
  const passos = [
    ['Você aceita', 'Pelo link da proposta ou me respondendo no WhatsApp.'],
    ['A gente alinha', 'Entendo seu negócio, seu público e o objetivo.'],
    ['Eu crio', 'Você acompanha e opina durante o processo.'],
    ['Entrega caprichada', 'Arquivos prontos pra usar, com aquele extra.'],
  ];
  // proposta curta: se o passo a passo empurraria o aceite para outra página, fica de fora
  const cabeTudo = y - (110 + 24 + 96) >= 56;
  const cabeAceite = y - 96 >= 56;
  if (cabeTudo || !cabeAceite) {
  cabe(110);
  escreve(pagina, 'SIMPLES ASSIM', M, y, F.tituloForte, 18, COR.tinta);
  y -= 18;
  const colW = (LARGURA - 3 * 14) / 4;
  let maisBaixo = y;
  passos.forEach(([t, dsc], i) => {
    const x = M + i * (colW + 14);
    pagina.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 1.6, color: COR.roxo });
    escreve(pagina, `0${i + 1}`, x, y - 26, F.tituloForte, 20, COR.roxo2);
    escreve(pagina, t, x, y - 44, F.extra, 10.5, COR.tinta);
    let yy = y - 58;
    for (const ln of linhas(F.texto, dsc, 8.8, colW)) {
      escreve(pagina, ln, x, yy, F.texto, 8.8, COR.texto3);
      yy -= 12;
    }
    maisBaixo = Math.min(maisBaixo, yy);
  });
  y = maisBaixo - 24;
  }

  // ------------------------------------------------------------- aceite e contato
  cabe(96);
  const altFim = 86;
  pagina.drawRectangle({ x: M, y: y - altFim, width: LARGURA, height: altFim, color: COR.noite });
  escreve(pagina, 'Para aceitar, abra a proposta online:', M + 20, y - 26, F.extra, 11, COR.branco);
  const urlCurta = urlProposta.replace(/^https?:\/\//, '');
  const wUrl = escreve(pagina, urlCurta, M + 20, y - 44, F.negrito, 9.5, COR.lilas);
  link(doc, pagina, urlProposta, M + 20, y - 48, wUrl, 14);
  const contato = `WhatsApp ${CONTATO.telefone}  ·  Instagram @${CONTATO.instagram}`;
  const wCont = escreve(pagina, contato, M + 20, y - 66, F.texto, 9.5, COR.textoHero);
  link(doc, pagina, `https://wa.me/${CONTATO.whatsapp}`, M + 20, y - 70, wCont / 2, 14);
  link(doc, pagina, `https://instagram.com/${CONTATO.instagram}`, M + 20 + wCont / 2, y - 70, wCont / 2, 14);
  y -= altFim + 22;

  // rodapé de todas as páginas
  const paginas = doc.getPages();
  paginas.forEach((pg, i) => {
    escreve(pg, `${CONTATO.nome} · ${CONTATO.cidade} · proposta para ${titulo}`, M, 30, F.texto, 7.5, COR.texto3);
    aDireita(pg, `${i + 1}/${paginas.length}`, A4[0] - M, 30, F.texto, 7.5, COR.texto3);
  });

  return doc.save();
}
