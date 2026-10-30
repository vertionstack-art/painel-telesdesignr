import type { Metadata } from 'next';
import Image from 'next/image';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Check, Gift, InstagramLogo, Phone, Quotes, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { marcarAberta, propostaDoLink } from '@/lib/dados';
import { calcular, moeda, tituloDa } from '@/lib/precos';
import { dataHora, dataLonga, primeiroNome } from '@/lib/formato';
import { CONTATO, linkWhats } from '@/lib/contato';
import { COOKIE, sessaoValida } from '@/lib/sessao';
import { Simbolo } from '@/app/marca';
import Aceite from './aceite';
import Imprimir from './imprimir';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string; token: string }> };

/** o título vira o nome do PDF: "Proposta - Barbearia do Rapha.pdf" */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, token } = await params;
  const p = await propostaDoLink(id, token);
  const nome = p ? tituloDa(p.dados) : null;
  return {
    title: { absolute: nome ? `Proposta - ${nome}` : 'Proposta' },
    description: nome ? `Proposta comercial do Teles Designr para ${nome}.` : undefined,
    robots: { index: false, follow: false },
  };
}

/**
 * O título encolhe pela maior palavra do nome, para nunca quebrar uma
 * palavra no meio ("CONFEITAR / IA"). 0,7 é a largura média de uma letra
 * da Archivo larga em caixa alta, em relação ao tamanho da fonte.
 */
function tamanhoDoNome(nome: string): string {
  const maior = Math.max(6, ...nome.split(/\s+/).map((p) => p.length));
  const porLetra = 0.7;
  return `min(124px, ${Math.floor(740 / (maior * porLetra))}px, ${(88 / (maior * porLetra)).toFixed(2)}vw)`;
}

const PASSOS = [
  { t: 'Você aceita', d: 'Clica em aceitar aqui embaixo ou me responde no WhatsApp.' },
  { t: 'A gente alinha', d: 'Entendo seu negócio, seu público e o objetivo.' },
  { t: 'Eu crio', d: 'Você acompanha e opina durante o processo.' },
  { t: 'Entrega caprichada', d: 'Arquivos prontos pra usar, com aquele extra.' },
];

export default async function PaginaProposta({ params }: Props) {
  const { id, token } = await params;
  const p = await propostaDoLink(id, token);
  if (!p) notFound();
  const conta = calcular(p.dados, p.tabela);
  if (!conta.linhas.length) notFound();

  /*
   * "O cliente abriu" não conta você (com o painel aberto no mesmo navegador)
   * nem o robô que monta a prévia do link quando ele é colado no WhatsApp.
   */
  const h = await headers();
  const navegador = h.get('user-agent') || '';
  const robo = !navegador || /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin|skype|headless|curl|wget|python|node-fetch|axios/i.test(navegador);
  const souEu = await sessaoValida((await cookies()).get(COOKIE)?.value);
  if (!robo && !souEu) await marcarAberta(p.id).catch(() => {});

  const d = p.dados;
  const titulo = tituloDa(d);
  const nomePessoa = primeiroNome(d.cliente.nome);
  const economia = (conta.unico ? conta.unico.combo + conta.unico.extra : 0) + (conta.mensal ? conta.mensal.combo + conta.mensal.extra : 0);
  const recado =
    d.mensagem.trim() ||
    `Montei esta proposta com o que conversamos. Abaixo está cada serviço, o que vem incluso e quanto fica. Qualquer dúvida, é só me chamar.`;
  const formas = [
    d.pagamento.metade ? '50% na aprovação e 50% na entrega' : null,
    d.pagamento.parcelado && conta.unico ? `Até ${p.tabela.parcelas}x sem juros no cartão` : null,
    d.pagamento.pix && conta.unico ? `Pix à vista com ${Math.round(p.tabela.pix * 100)}% de desconto` : null,
    conta.mensal ? 'Gestão de redes cobrada mês a mês' : null,
  ].filter(Boolean) as string[];
  const duvida = linkWhats(`Oi, Lucas! Vi a proposta para ${titulo} e fiquei com uma dúvida:`);

  return (
    <div className="min-h-dvh bg-[#070707] print:bg-white print:text-tinta">
      {/* ------------------------------------------------------------ topo */}
      <header className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-[1200px] px-5 pb-14 pt-6 sm:px-10 lg:pb-24">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2.5">
              <Simbolo />
              <b className="larga whitespace-nowrap text-[14px] tracking-[0.03em] [font-stretch:118%]">TELES DESIGNR</b>
            </span>
            <p className="text-right text-[12.5px] font-semibold leading-snug">
              {dataLonga(p.atualizadaEm)}
              <span className="block font-medium text-[#a8a0bb] print:text-[#5d5670]">Rio de Janeiro · desde {CONTATO.desde}</span>
            </p>
          </div>

          <div className="mt-14 max-w-[760px] lg:mt-24">
            <h1 className="larga uppercase leading-[0.88] tracking-[-0.05em]">
              <span className="block animate-[subir_700ms_var(--ease-saida)_both] text-[clamp(30px,6vw,56px)] text-[#a8a0bb] print:text-[#5d5670]">
                Proposta para
              </span>
              <span
                className="mt-1 block break-words text-roxo [animation-delay:90ms] animate-[subir_800ms_var(--ease-saida)_both]"
                style={{ fontSize: tamanhoDoNome(titulo) }}
              >
                {titulo}
              </span>
            </h1>
            <div className="mt-8 flex max-w-[52ch] gap-4 animate-[subir_800ms_var(--ease-saida)_180ms_both]">
              <span className="relative mt-1 hidden h-12 w-12 shrink-0 overflow-hidden rounded-full bg-tinta-3 sm:block lg:hidden print:hidden">
                <Image src="/img/teles-designr.webp" alt="" fill sizes="48px" className="object-cover object-top" />
              </span>
              <p className="text-[17px] font-medium leading-relaxed text-[#d4cde2] print:text-tinta">
                {nomePessoa && <b className="text-papel print:text-tinta">Oi, {nomePessoa}! </b>}
                <span className="whitespace-pre-line">{recado}</span>
              </p>
            </div>
          </div>
        </div>
        {/* a foto da hero da landing, no canto, só no computador */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[-4%] top-0 hidden w-[44%] max-w-[600px] lg:block print:hidden">
          <Image
            src="/img/teles-designr.webp"
            alt=""
            fill
            priority
            sizes="600px"
            className="animate-[subir_1100ms_var(--ease-saida)_both] object-cover object-top [mask-image:linear-gradient(90deg,transparent,#000_30%,#000_80%,transparent),linear-gradient(180deg,#000_70%,transparent)] [mask-composite:intersect]"
          />
        </div>
      </header>

      <div className="border-y border-white/14 bg-black print:hidden">
        <div className="larga mx-auto flex min-h-[64px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[11px] tracking-[0.06em] [font-stretch:118%] sm:px-10 sm:text-[13px]">
          <span>
            DESDE <span className="text-roxo-2">{CONTATO.desde}</span>
          </span>
          <span className="hidden text-[#a8a0bb] sm:inline">IDENTIDADE · ARTES · VÍDEO · REDES</span>
          <span className="text-roxo-2">RIO DE JANEIRO</span>
        </div>
      </div>

      <main className="bg-tinta print:bg-white">
        {/* -------------------------------------------------------- serviços */}
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <h2 className="condensada text-[clamp(52px,12vw,104px)] font-normal print:text-tinta">
                O que
                <br />
                <span className="marca-texto">você leva</span>
              </h2>
              <ul className="mt-10 border-t border-white/12 print:border-papel-3">
                {conta.linhas.map((l) => (
                  <li key={l.chave} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 border-b border-white/12 py-5 print:border-papel-3">
                    <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-roxo text-white">
                      <Check className="h-3.5 w-3.5" weight="bold" />
                    </span>
                    <span className="min-w-0">
                      <b className="block text-[18px] font-extrabold leading-tight">{l.nome}</b>
                      {l.detalhe && <span className="mt-1 block text-[15px] leading-snug text-mudo print:text-[#5d5670]">{l.detalhe}</span>}
                    </span>
                    <span className="numeros pt-0.5 text-right text-[15.5px] font-bold text-papel/90 print:text-tinta">
                      {l.aPartir && <small className="block text-[11.5px] font-semibold text-mudo-2">a partir de</small>}
                      {moeda(l.valor)}
                      {l.mensal && <small className="text-[12.5px] text-mudo-2">/mês</small>}
                    </span>
                  </li>
                ))}
              </ul>
              {d.prazo.trim() && (
                <p className="mt-6 text-[15px] leading-relaxed text-mudo print:text-[#5d5670]">
                  <b className="text-papel print:text-tinta">Prazo: </b>
                  {d.prazo.trim()}
                </p>
              )}
            </div>

            {/* o valor, no papel claro do resumo do simulador */}
            <aside className="rounded-[24px] border border-white/12 bg-white/[0.06] p-1.5 lg:sticky lg:top-6 print:border-papel-3 print:bg-transparent">
              <div className="rounded-[18px] bg-papel px-6 py-7 text-tinta sm:px-8 sm:py-8">
                <h3 className="text-[22px] font-extrabold tracking-[-0.01em]">Investimento</h3>
                {(['unico', 'mensal'] as const).map((qual) => {
                  const b = conta[qual];
                  if (!b) return null;
                  const mes = qual === 'mensal';
                  return (
                    <div key={qual} className="mt-5 border-t border-papel-3 pt-5 first-of-type:border-t-0 first-of-type:pt-0">
                      <p className="text-[14px] font-bold text-[#4c4560]">{mes ? 'Por mês' : conta.mensal ? 'Pagamento único' : 'Total'}</p>
                      {(b.combo > 0 || b.extra > 0) && (
                        <p className="numeros mt-1 text-[15px] text-[#6f6880] line-through decoration-[#6f6880]/60">{moeda(b.subtotal)}</p>
                      )}
                      <p className="numeros mt-1 font-display text-[clamp(44px,9vw,60px)] font-extrabold leading-none tracking-[-0.025em] text-roxo [font-stretch:86%]">
                        {conta.aPartir && !mes && <small className="mr-1 font-sans text-[15px] font-bold tracking-normal">a partir de</small>}
                        {moeda(b.total)}
                        {mes && <small className="text-[18px]">/mês</small>}
                      </p>
                      {!mes && (d.pagamento.parcelado || d.pagamento.pix) && (
                        <div className="numeros mt-3 grid gap-1.5 text-[15px] font-bold">
                          {d.pagamento.parcelado && (
                            <p>
                              ou {p.tabela.parcelas}x de {moeda(b.parcela)} <span className="font-semibold text-[#6f6880]">sem juros</span>
                            </p>
                          )}
                          {d.pagamento.pix && (
                            <p>
                              ou {moeda(b.pix)} <span className="font-semibold text-[#6f6880]">à vista no Pix</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {economia > 0 && (
                  <p className="numeros mt-5 inline-flex items-center gap-2 rounded-full bg-[#e3f5ea] px-3.5 py-1.5 text-[13.5px] font-extrabold text-ok">
                    <Gift className="h-4 w-4" weight="bold" /> Você economiza {moeda(economia)}
                    {conta.combo ? ' com o combo' : ''}
                  </p>
                )}
                {conta.aPartir && (
                  <p className="mt-4 text-[13px] leading-relaxed text-[#6f6880]">A identidade completa varia com o que for pedido. O valor final a gente fecha na conversa.</p>
                )}

                {formas.length > 0 && (
                  <div className="mt-6 border-t border-papel-3 pt-5">
                    <p className="text-[14px] font-bold">Formas de pagamento</p>
                    <ul className="mt-2.5 grid gap-2">
                      {formas.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-[#3f3a4a]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-roxo" weight="bold" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-1.5">
                  {['Alterações sem custo', 'Atendimento direto comigo'].map((x) => (
                    <span key={x} className="inline-flex items-center gap-1.5 rounded-full bg-lilas-claro px-3 py-1.5 text-[12.5px] font-bold text-roxo-escuro">
                      <Check className="h-3.5 w-3.5" weight="bold" />
                      {x}
                    </span>
                  ))}
                </div>

                <div className="mt-7 print:hidden">
                  {p.aceite ? (
                    <p className="rounded-[14px] bg-[#e3f5ea] p-4 text-[15px] font-semibold leading-relaxed text-[#14532d]">
                      Proposta aceita por <b>{p.aceite.nome}</b> em {dataHora(p.aceite.em)}. Obrigado pela confiança!
                    </p>
                  ) : p.status === 'recusada' ? (
                    <p className="rounded-[14px] bg-papel-2 p-4 text-[15px] leading-relaxed text-[#4c4560]">
                      Esta proposta foi encerrada. Se quiser retomar, me chama no WhatsApp.
                    </p>
                  ) : (
                    <Aceite id={p.id} token={p.token} titulo={titulo} nomeSugerido={d.cliente.nome} />
                  )}
                  <a
                    href={duvida}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-flex min-h-[52px] w-full items-center justify-between gap-3 rounded-full bg-wa pl-6 pr-2 text-[15.5px] font-extrabold text-wa-escuro transition-transform duration-150 active:scale-[0.97]"
                  >
                    Tirar dúvida no WhatsApp
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-wa-escuro/12">
                      <WhatsappLogo className="h-5 w-5" weight="fill" />
                    </span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* -------------------------------------------------------- como segue */}
        <section className="border-t border-white/12 print:break-inside-avoid print:border-papel-3">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-10 lg:py-20">
            <h2 className="condensada text-[clamp(48px,10vw,88px)] font-normal">
              Simples
              <br />
              <span className="contorno text-papel print:text-tinta">assim</span>
            </h2>
            <ol className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
              {PASSOS.map((s, i) => (
                <li key={s.t} className="grid grid-cols-[56px_1fr] gap-3 border-t border-white/12 py-5 lg:grid-cols-1 lg:border-t-2 lg:border-roxo print:border-papel-3">
                  <span className="condensada text-[44px] font-extrabold text-roxo-2">0{i + 1}</span>
                  <div>
                    <b className="block text-[18px] font-extrabold">{s.t}</b>
                    <span className="mt-1 block text-[15px] leading-snug text-mudo print:text-[#5d5670]">{s.d}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* -------------------------------------------------------- propósito */}
        <section className="bg-[radial-gradient(60%_60%_at_50%_50%,rgba(139,44,255,0.28),transparent_70%)] px-5 py-20 text-center print:hidden">
          <Quotes aria-hidden className="mx-auto h-14 w-14 text-roxo" weight="fill" />
          <blockquote className="mx-auto mt-3 max-w-[18ch] text-[clamp(28px,6.5vw,52px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
            Design bonito é bom. Design <span className="text-lilas">com propósito</span> transforma.
          </blockquote>
          <p className="mt-6 inline-block -rotate-[4deg] font-mao text-[44px] leading-none">Teles Designr</p>
          <p className="mt-1 text-[14px] font-semibold text-mudo">Designer, social media e editor de vídeo</p>
        </section>
      </main>

      {/* ------------------------------------------------------------ rodapé */}
      <footer className="border-t border-white/12 bg-tinta print:border-papel-3 print:bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-2 px-5 pb-28 pt-8 sm:grid-cols-3 sm:px-10 sm:pb-10">
          <a href={linkWhats('Oi, Lucas!')} target="_blank" rel="noopener" className="group flex items-center gap-3 rounded-[14px] p-2 transition-colors hover:bg-white/5">
            <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-roxo/20 text-roxo-2"><Phone className="h-5 w-5" weight="bold" /></span>
            <span><small className="block text-[12.5px] font-semibold text-mudo-2">WhatsApp</small><b className="text-[15.5px]">{CONTATO.telefone}</b></span>
            <ArrowUpRight aria-hidden className="ml-auto h-4 w-4 text-roxo-2 print:hidden" weight="bold" />
          </a>
          <a href={`https://instagram.com/${CONTATO.instagram}`} target="_blank" rel="noopener" className="group flex items-center gap-3 rounded-[14px] p-2 transition-colors hover:bg-white/5">
            <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-roxo/20 text-roxo-2"><InstagramLogo className="h-5 w-5" weight="bold" /></span>
            <span><small className="block text-[12.5px] font-semibold text-mudo-2">Instagram</small><b className="text-[15.5px]">@{CONTATO.instagram}</b></span>
            <ArrowUpRight aria-hidden className="ml-auto h-4 w-4 text-roxo-2 print:hidden" weight="bold" />
          </a>
          <div className="flex items-center gap-3 p-2 print:hidden">
            <Imprimir href={`/p/${p.id}/${p.token}/pdf`} />
          </div>
          <p className="pt-4 text-[12.5px] leading-relaxed text-mudo-2 sm:col-span-3">
            Proposta feita para {titulo} em {dataLonga(p.atualizadaEm)}. {CONTATO.nome} · {CONTATO.cidade}.
          </p>
        </div>
      </footer>

      {/* barra fixa no celular: a dúvida sempre a um toque */}
      {!p.aceite && p.status !== 'recusada' && (
        <div className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 rounded-full border border-white/14 bg-tinta-2/95 py-2 pl-5 pr-2 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] sm:hidden print:hidden">
          <p className="min-w-0 text-[12.5px] font-semibold leading-tight text-mudo">
            <b className="numeros block truncate text-[15px] text-papel">
              {conta.unico ? moeda(conta.unico.total) : conta.mensal ? `${moeda(conta.mensal.total)}/mês` : ''}
            </b>
            {conta.unico && conta.mensal
              ? `+ ${moeda(conta.mensal.total)}/mês`
              : conta.unico && d.pagamento.parcelado
                ? `ou ${p.tabela.parcelas}x de ${moeda(conta.unico.parcela)}`
                : 'Teles Designr'}
          </p>
          <a href="#aceitar" className="ml-auto inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-roxo px-4 text-[14px] font-extrabold text-white">
            <Check className="h-4 w-4" weight="bold" /> Aceitar
          </a>
        </div>
      )}
    </div>
  );
}
