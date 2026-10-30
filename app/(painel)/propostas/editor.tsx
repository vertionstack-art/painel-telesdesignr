'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  CircleNotch,
  Copy,
  CopySimple,
  FilePdf,
  FilmStrip,
  Globe,
  Images,
  InstagramLogo,
  PenNib,
  Plus,
  Sparkle,
  Trash,
  VideoCamera,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react';
import {
  IDENTIDADES,
  PERFIS,
  calcular,
  moeda,
  quebrado,
  tituloDa,
  type DadosProposta,
  type IdentidadeId,
  type ItemLivre,
  type PerfilId,
  type Tabela,
} from '@/lib/precos';
import type { Status } from '@/lib/dados';
import { dataHora, numeroWa, primeiroNome } from '@/lib/formato';
import { apagar, duplicar, enviada, mudarStatus, recadoComIa, salvar } from '../acoes';
import { Selo } from '../status';
import { Campo, CampoValor, Contador, Etapa, Marcador, Opcoes, Pilulas, Servico } from './pecas';

export interface Meta {
  id: string;
  token: string;
  status: Status;
  abertaEm: string | null;
  aberturas: number;
  aceite: { nome: string; em: string } | null;
  enviadaEm: string | null;
}

const semAssinatura = () => () => {};
const novoId = () => Math.random().toString(36).slice(2, 9);

export default function Editor({
  inicial,
  tabela,
  meta,
  iaLigada,
}: {
  inicial: DadosProposta;
  tabela: Tabela;
  meta: Meta | null;
  iaLigada: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState<DadosProposta>(inicial);
  const [id, setId] = useState<string | null>(meta?.id ?? null);
  const [token, setToken] = useState<string | null>(meta?.token ?? null);
  const [sujo, setSujo] = useState(!meta);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [pendente, comecar] = useTransition();
  // o endereço do site só existe no navegador
  const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => '');

  const conta = useMemo(() => calcular(d, tabela), [d, tabela]);
  const k = conta.perfil.k;
  const comPerfil = (v: number) => moeda(quebrado(v * k));

  /** muda um pedaço da proposta e marca que tem coisa por salvar */
  const mudar = useCallback((f: (x: DadosProposta) => DadosProposta) => {
    setD((x) => f(x));
    setSujo(true);
    setAviso(null);
  }, []);
  const cliente = (campo: keyof DadosProposta['cliente'], v: string) => mudar((x) => ({ ...x, cliente: { ...x.cliente, [campo]: v } }));
  const servico = <K extends keyof DadosProposta['servicos']>(campo: K, v: DadosProposta['servicos'][K]) =>
    mudar((x) => ({ ...x, servicos: { ...x.servicos, [campo]: v } }));
  const livre = (i: number, p: Partial<ItemLivre>) => mudar((x) => ({ ...x, livres: x.livres.map((it, j) => (j === i ? { ...it, ...p } : it)) }));

  // o recado com IA: o que você tinha escrito antes fica guardado para voltar
  const [recado, setRecado] = useState<{ gerando: boolean; erro: string | null; anterior: string | null }>({ gerando: false, erro: null, anterior: null });
  async function gerarRecado() {
    // "Gerar de novo" parte do seu rascunho original, não do texto da IA
    const base = recado.anterior ?? d.mensagem;
    if (base.trim().length < 8) {
      setRecado((r) => ({ ...r, erro: 'Escreva primeiro, do seu jeito, o que quer dizer ao cliente.' }));
      return;
    }
    setRecado((r) => ({ ...r, gerando: true, erro: null }));
    const r = await recadoComIa(base, d, tabela);
    if (r.ok) {
      mudar((x) => ({ ...x, mensagem: r.texto }));
      setRecado({ gerando: false, erro: null, anterior: base });
    } else {
      setRecado((x) => ({ ...x, gerando: false, erro: r.erro }));
    }
  }

  const link = id && token && origem ? `${origem}/p/${id}/${token}` : null;

  /** salva e devolve o link já pronto (numa proposta nova, o id e o token nascem aqui) */
  const salvarAgora = useCallback(async (): Promise<string | null> => {
    setSalvando(true);
    setAviso(null);
    const r = await salvar(id, d);
    setSalvando(false);
    if (!r.ok) {
      setAviso({ tipo: 'erro', texto: r.erro });
      return null;
    }
    setSujo(false);
    setToken(r.token);
    if (r.id !== id) {
      setId(r.id);
      // troca o endereço sem recarregar: a tela continua a mesma
      window.history.replaceState(null, '', `/propostas/${r.id}`);
    } else {
      router.refresh();
    }
    return `${window.location.origin}/p/${r.id}/${r.token}`;
  }, [id, d, router]);

  // Ctrl+S salva
  const salvarRef = useRef(salvarAgora);
  useEffect(() => {
    salvarRef.current = salvarAgora;
  }, [salvarAgora]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        salvarRef.current().then((r) => r && setAviso({ tipo: 'ok', texto: 'Salvo.' }));
      }
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);

  // sair com coisa por salvar pede confirmação
  useEffect(() => {
    if (!sujo) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', f);
    return () => removeEventListener('beforeunload', f);
  }, [sujo]);

  const semServico = conta.linhas.length === 0;
  const numero = numeroWa(d.cliente.whatsapp);
  const textoWhats = (url: string) =>
    [
      `Oi${d.cliente.nome.trim() ? `, ${primeiroNome(d.cliente.nome)}` : ''}! Tudo bem?`,
      `Montei a proposta ${d.cliente.negocio.trim() ? `para ${d.cliente.negocio.trim()}` : 'que conversamos'}. Está tudo aqui, com valores e formas de pagamento:`,
      url,
      'Qualquer dúvida, é só me chamar aqui.',
    ].join('\n\n');

  /** salva o que faltar e devolve o link da proposta */
  async function linkPronto(): Promise<string | null> {
    if (semServico) {
      setAviso({ tipo: 'erro', texto: 'Marque pelo menos um serviço antes de mandar.' });
      return null;
    }
    if (sujo || !link) return salvarAgora();
    return link;
  }

  async function copiarLink() {
    const url = await linkPronto();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setAviso({ tipo: 'ok', texto: 'Link copiado. Cole na conversa com o cliente.' });
    } catch {
      setAviso({ tipo: 'erro', texto: 'O navegador não deixou copiar. Selecione o link abaixo e copie.' });
    }
    const alvo = url.split('/p/')[1]?.split('/')[0];
    if (alvo) comecar(() => enviada(alvo));
  }

  async function mandarWhats() {
    // abre a aba já no clique (o navegador bloqueia janela aberta depois de esperar)
    const aba = semServico ? null : window.open('about:blank', '_blank');
    const url = await linkPronto();
    if (!url) {
      aba?.close();
      return;
    }
    const wa = `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(textoWhats(url))}`;
    if (aba) aba.location.href = wa;
    else window.location.href = wa;
    const alvo = url.split('/p/')[1]?.split('/')[0];
    if (alvo) comecar(() => enviada(alvo));
  }

  return (
    <div className="grid items-start gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)] lg:gap-8">
      <div className="grid gap-4">
        {/* ------------------------------------------------ cliente */}
        <Etapa n={1} titulo="Cliente">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Campo rotulo="Nome da pessoa" value={d.cliente.nome} onChange={(e) => cliente('nome', e.target.value)} placeholder="Com quem você fala" autoComplete="off" />
            <Campo rotulo="Negócio" opcional value={d.cliente.negocio} onChange={(e) => cliente('negocio', e.target.value)} placeholder="Empresa, igreja, marca…" autoComplete="off" />
            <Campo rotulo="WhatsApp" value={d.cliente.whatsapp} onChange={(e) => cliente('whatsapp', e.target.value)} placeholder="(21) 99999-9999" inputMode="tel" autoComplete="off" />
            <Campo rotulo="Cidade" opcional value={d.cliente.cidade} onChange={(e) => cliente('cidade', e.target.value)} placeholder="Rio de Janeiro" autoComplete="off" />
            <Campo rotulo="Instagram" opcional value={d.cliente.instagram} onChange={(e) => cliente('instagram', e.target.value)} placeholder="@perfil" autoComplete="off" />
            <Campo rotulo="E-mail" opcional type="email" value={d.cliente.email} onChange={(e) => cliente('email', e.target.value)} placeholder="nome@email.com" autoComplete="off" />
          </div>
          <p className="mb-2.5 mt-6 text-[13.5px] font-bold text-[#e6e1ef]">Perfil</p>
          <Pilulas<PerfilId>
            nome="perfil"
            rotulo="Perfil do cliente"
            valor={d.cliente.perfil}
            aoMudar={(v) => cliente('perfil', v)}
            opcoes={PERFIS.map((p) => ({
              id: p,
              rotulo: tabela.perfis[p].nome.replace(' (ME/EPP)', ''),
              extra: tabela.perfis[p].k > 1 ? `+${Math.round((tabela.perfis[p].k - 1) * 100)}%` : undefined,
            }))}
          />
        </Etapa>

        {/* ------------------------------------------------ serviços */}
        <Etapa n={2} titulo="Serviços">
          <div className="grid gap-2.5">
            <Servico
              ligado={Boolean(d.servicos.identidade)}
              aoMudar={(v) => servico('identidade', v ? 'basica' : null)}
              icone={PenNib}
              titulo="Identidade visual"
              detalhe="Logo, cores e tipografia"
            >
              <Opcoes<IdentidadeId>
                nome="identidade"
                rotulo="Nível da identidade"
                valor={d.servicos.identidade || 'basica'}
                aoMudar={(v) => servico('identidade', v)}
                opcoes={IDENTIDADES.map((i) => ({
                  id: i,
                  titulo: tabela.identidade[i].nome,
                  detalhe: tabela.identidade[i].detalhe,
                  preco: `${tabela.identidade[i].aPartir ? 'a partir de ' : ''}${comPerfil(tabela.identidade[i].v)}`,
                }))}
              />
            </Servico>

            <Servico
              ligado={Boolean(d.servicos.artes)}
              aoMudar={(v) => servico('artes', v ? Object.keys(tabela.artes)[0] : null)}
              icone={Images}
              titulo="Pacote de artes"
              detalhe="Posts, carrosséis, flyers e banners"
            >
              <Opcoes
                nome="artes"
                rotulo="Quantidade de artes"
                valor={d.servicos.artes || ''}
                aoMudar={(v) => servico('artes', v)}
                opcoes={Object.entries(tabela.artes).map(([q, v]) => ({ id: q, titulo: `${q} artes`, detalhe: 'no pacote', preco: comPerfil(v) }))}
              />
            </Servico>

            <Servico
              ligado={Boolean(d.servicos.videos)}
              aoMudar={(v) => servico('videos', v ? Object.keys(tabela.videos)[0] : null)}
              icone={FilmStrip}
              titulo="Pacote de vídeos"
              detalhe="Vídeos institucionais e Reels com legenda"
            >
              <Opcoes
                nome="videos"
                rotulo="Quantidade de vídeos"
                valor={d.servicos.videos || ''}
                aoMudar={(v) => servico('videos', v)}
                opcoes={Object.entries(tabela.videos).map(([q, v]) => ({ id: q, titulo: `${q} vídeos`, detalhe: 'no pacote', preco: comPerfil(v) }))}
              />
            </Servico>

            <Servico
              ligado={Boolean(d.servicos.redes)}
              aoMudar={(v) => servico('redes', v ? { plano: Object.keys(tabela.redes.planos)[0], carrossel: 0, reels: 0 } : null)}
              icone={InstagramLogo}
              titulo="Gestão de redes"
              detalhe="Planejamento, artes, legendas e postagem (mensal)"
            >
              {d.servicos.redes && (
                <>
                  <Opcoes
                    nome="plano"
                    rotulo="Posts por semana"
                    valor={d.servicos.redes.plano}
                    aoMudar={(v) => servico('redes', { ...d.servicos.redes!, plano: v })}
                    opcoes={Object.entries(tabela.redes.planos).map(([q, v]) => ({ id: q, titulo: `${q} posts`, detalhe: 'por semana', preco: `${comPerfil(v)}/mês` }))}
                  />
                  <div className="grid gap-3 pt-1">
                    <Contador
                      rotulo="Carrosséis no mês"
                      detalhe={`De 5 a 10 slides · ${comPerfil(tabela.redes.carrossel)} cada`}
                      valor={d.servicos.redes.carrossel}
                      min={0}
                      max={20}
                      aoMudar={(v) => servico('redes', { ...d.servicos.redes!, carrossel: v })}
                    />
                    <Contador
                      rotulo="Reels editados no mês"
                      detalhe={`${comPerfil(tabela.redes.reels)} cada`}
                      valor={d.servicos.redes.reels}
                      min={0}
                      max={20}
                      aoMudar={(v) => servico('redes', { ...d.servicos.redes!, reels: v })}
                    />
                  </div>
                </>
              )}
            </Servico>

            <Servico
              ligado={Boolean(d.servicos.captacao)}
              aoMudar={(v) => servico('captacao', v ? { dias: 1 } : null)}
              icone={VideoCamera}
              titulo="Gravação no local"
              detalhe="Captação presencial, só no Rio de Janeiro"
            >
              {d.servicos.captacao && (
                <>
                  <Contador
                    rotulo="Dias de gravação"
                    detalhe={`${moeda(tabela.diaria)} por dia, sem ajuste de perfil nem combo`}
                    valor={d.servicos.captacao.dias}
                    min={1}
                    max={30}
                    aoMudar={(v) => servico('captacao', { dias: v })}
                  />
                </>
              )}
            </Servico>
          </div>
        </Etapa>

        {/* ------------------------------------------------ itens livres */}
        <Etapa n={3} titulo="Itens à parte">
          <p className="-mt-1 mb-4 text-[14px] leading-relaxed text-mudo">
            Qualquer coisa fora da tabela, com o preço que você combinar. Não entra no ajuste de perfil nem no combo.
          </p>
          {d.livres.length > 0 && (
            <ul className="mb-4 grid gap-3">
              {d.livres.map((it, i) => (
                <li key={it.id} className="grid gap-3 rounded-[18px] border-[1.5px] border-white/14 bg-tinta p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <Campo rotulo="Serviço" value={it.nome} onChange={(e) => livre(i, { nome: e.target.value })} placeholder="Cardápio, fachada, site…" />
                    <CampoValor rotulo="Valor (R$)" valor={it.valor} aoMudar={(n) => livre(i, { valor: n || 0 })} placeholder="0,00" className="numeros" />
                  </div>
                  <Campo rotulo="O que inclui" opcional value={it.detalhe} onChange={(e) => livre(i, { detalhe: e.target.value })} placeholder="Uma linha que o cliente vai ler" />
                  <div className="flex items-center justify-between gap-3">
                    <Marcador ligado={it.mensal} aoMudar={(v) => livre(i, { mensal: v })}>
                      Cobrado todo mês
                    </Marcador>
                    <button
                      type="button"
                      onClick={() => mudar((x) => ({ ...x, livres: x.livres.filter((_, j) => j !== i) }))}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-mudo transition-colors hover:bg-white/5 hover:text-erro"
                    >
                      <X className="h-4 w-4" weight="bold" /> Tirar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => mudar((x) => ({ ...x, livres: [...x.livres, { id: novoId(), nome: '', detalhe: '', valor: 0, mensal: false }] }))}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-white/25 px-4 text-[14px] font-bold transition-colors hover:border-white/60"
            >
              <Plus className="h-4 w-4" weight="bold" /> Adicionar item
            </button>
            <button
              type="button"
              onClick={() =>
                mudar((x) => ({
                  ...x,
                  livres: [...x.livres, { id: novoId(), nome: 'Site profissional', detalhe: 'Feito em parceria com a Vertion Stack', valor: 0, mensal: false }],
                }))
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-white/25 px-4 text-[14px] font-bold transition-colors hover:border-white/60"
            >
              <Globe className="h-4 w-4" weight="bold" /> Site · Vertion Stack
            </button>
          </div>
        </Etapa>

        {/* ------------------------------------------------ condições */}
        <Etapa n={4} titulo="Pagamento e prazo">
          <p className="mb-3 text-[13.5px] font-bold text-[#e6e1ef]">Formas de pagamento na proposta</p>
          <div className="grid gap-3">
            <Marcador ligado={d.pagamento.metade} aoMudar={(v) => mudar((x) => ({ ...x, pagamento: { ...x.pagamento, metade: v } }))}>
              50% na aprovação e 50% na entrega
            </Marcador>
            <Marcador ligado={d.pagamento.parcelado} aoMudar={(v) => mudar((x) => ({ ...x, pagamento: { ...x.pagamento, parcelado: v } }))}>
              Até {tabela.parcelas}x sem juros no cartão
            </Marcador>
            <Marcador ligado={d.pagamento.pix} aoMudar={(v) => mudar((x) => ({ ...x, pagamento: { ...x.pagamento, pix: v } }))}>
              Pix à vista com {Math.round(tabela.pix * 100)}% de desconto
            </Marcador>
          </div>

          <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
            <CampoValor
              rotulo="Desconto a mais (%)"
              opcional
              valor={d.desconto || null}
              aoMudar={(n) => mudar((x) => ({ ...x, desconto: Math.min(n || 0, 90) }))}
              placeholder="0"
              className="numeros"
            />
            <CampoValor
              rotulo="Valor combinado (único)"
              opcional
              valor={d.manualUnico}
              aoMudar={(n) => mudar((x) => ({ ...x, manualUnico: n }))}
              placeholder={conta.unico ? moeda(conta.unico.calculado).replace('R$', '').trim() : '—'}
              className="numeros"
            />
            <CampoValor
              rotulo="Valor combinado (mensal)"
              opcional
              valor={d.manualMensal}
              aoMudar={(n) => mudar((x) => ({ ...x, manualMensal: n }))}
              placeholder={conta.mensal ? moeda(conta.mensal.calculado).replace('R$', '').trim() : '—'}
              className="numeros"
            />
          </div>
          <p className="mt-2 text-[12.5px] leading-snug text-mudo-2">O valor combinado substitui o calculado. Deixe vazio para usar a tabela.</p>

          <Campo
            rotulo="Prazo de entrega"
            opcional
            className="mt-5"
            value={d.prazo}
            onChange={(e) => mudar((x) => ({ ...x, prazo: e.target.value }))}
            placeholder="Ex.: primeira versão em 7 dias úteis"
          />
        </Etapa>

        {/* ------------------------------------------------ mensagem */}
        <Etapa n={5} titulo="Recado para o cliente">
          <label className="grid gap-1.5">
            <span className="text-[13.5px] font-bold text-[#e6e1ef]">
              Aparece no topo da proposta <em className="font-medium not-italic text-mudo">(opcional)</em>
            </span>
            <textarea
              value={d.mensagem}
              onChange={(e) => {
                mudar((x) => ({ ...x, mensagem: e.target.value }));
                setRecado((r) => ({ ...r, erro: null }));
              }}
              rows={5}
              disabled={recado.gerando}
              placeholder="Escreva do seu jeito, ex.: agradecer a oportunidade, dizer que a ideia é deixar o Instagram com cara profissional antes da inauguração e que qualquer ajuste é só falar"
              className="campo min-h-[132px] resize-y py-3 leading-relaxed disabled:opacity-60"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={gerarRecado}
              disabled={recado.gerando || !iaLigada}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-roxo pl-4 pr-5 text-[14px] font-extrabold text-white transition-transform duration-150 ease-[var(--ease-saida)] active:scale-[0.97] disabled:opacity-45"
            >
              {recado.gerando ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
              {recado.gerando ? 'Escrevendo…' : d.mensagem.trim() && recado.anterior !== null ? 'Gerar de novo' : 'Gerar recado com IA'}
            </button>
            {recado.anterior !== null && !recado.gerando && (
              <button
                type="button"
                onClick={() => {
                  const volta = recado.anterior ?? '';
                  mudar((x) => ({ ...x, mensagem: volta }));
                  setRecado({ gerando: false, erro: null, anterior: null });
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/20 px-4 text-[13.5px] font-bold transition-colors hover:border-white/50"
              >
                <ArrowCounterClockwise className="h-4 w-4" weight="bold" /> Voltar ao que eu escrevi
              </button>
            )}
          </div>
          <p role={recado.erro ? 'alert' : undefined} className={`mt-2 text-[12.5px] leading-snug ${recado.erro ? 'font-bold text-erro' : 'text-mudo-2'}`}>
            {recado.erro ||
              (iaLigada
                ? 'Escreva do seu jeito e clique em gerar: a IA reescreve no tom da proposta, sem inventar nada. Você pode editar depois.'
                : 'Para ligar a IA, cadastre a chave GROQ_API_KEY na Vercel.')}
          </p>
        </Etapa>
      </div>

      {/* ------------------------------------------------ resumo */}
      <aside className="lg:sticky lg:top-[88px]" aria-live="polite">
        <div className="rounded-[24px] border border-white/12 bg-white/[0.06] p-1.5">
          <div className="rounded-[18px] bg-papel px-5 py-6 text-tinta sm:px-7 sm:py-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[22px] font-extrabold tracking-[-0.01em]">{tituloDa(d)}</h2>
                <p className="mt-0.5 text-[13.5px] text-[#5d5670]">
                  {conta.perfil.nome}
                  {k > 1 ? ` · valores +${Math.round((k - 1) * 100)}%` : ''}
                </p>
              </div>
              {meta && <Selo status={meta.status} />}
            </div>

            {semServico ? (
              <p className="mt-5 rounded-[14px] bg-papel-2 p-4 text-[14.5px] leading-relaxed text-[#4c4560]">
                Marque pelo menos um serviço e o valor aparece aqui na hora.
              </p>
            ) : (
              <>
                <ul className="mt-4">
                  {conta.linhas.map((l) => (
                    <li key={l.chave} className="flex justify-between gap-4 border-t border-papel-3 py-2.5 text-[14.5px] first:border-t-0">
                      <span className="min-w-0">
                        {l.nome}
                        <small className="block truncate text-[12.5px] text-[#6f6880]">{l.detalhe}</small>
                      </span>
                      <b className="numeros shrink-0 font-extrabold">
                        {moeda(l.valor)}
                        {l.mensal ? '/mês' : ''}
                      </b>
                    </li>
                  ))}
                </ul>
                {(['unico', 'mensal'] as const).map((qual) => {
                  const b = conta[qual];
                  if (!b) return null;
                  const mes = qual === 'mensal';
                  return (
                    <div key={qual} className="mt-3 rounded-[14px] bg-papel-2 p-4">
                      {(b.combo > 0 || b.extra > 0) && (
                        <div className="numeros grid gap-1 text-[13.5px] text-[#4c4560]">
                          <div className="flex justify-between"><span>Subtotal</span><span>{moeda(b.subtotal)}</span></div>
                          {b.combo > 0 && (
                            <div className="flex justify-between font-bold text-ok"><span>Combo (−{Math.round(tabela.combo * 100)}%)</span><span>−{moeda(b.combo)}</span></div>
                          )}
                          {b.extra > 0 && (
                            <div className="flex justify-between font-bold text-ok"><span>Desconto (−{d.desconto}%)</span><span>−{moeda(b.extra)}</span></div>
                          )}
                        </div>
                      )}
                      <div className={`flex items-baseline justify-between gap-3 ${b.combo > 0 || b.extra > 0 ? 'mt-2.5 border-t border-[#d9d2e8] pt-2.5' : ''}`}>
                        <span className="text-[14px] font-bold">{mes ? 'Mensal' : 'Pagamento único'}</span>
                        <b className="numeros font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] text-roxo [font-stretch:90%]">
                          {conta.aPartir && !mes && <small className="font-sans text-[13px] font-bold">a partir de </small>}
                          {moeda(b.total)}
                          {mes && <small className="text-[15px]">/mês</small>}
                        </b>
                      </div>
                      {b.manual && <p className="mt-1 text-right text-[12.5px] font-semibold text-[#6f6880]">Valor combinado (tabela: {moeda(b.calculado)})</p>}
                      {!mes && (d.pagamento.parcelado || d.pagamento.pix) && (
                        <p className="numeros mt-1.5 text-right text-[13.5px] font-bold">
                          {[d.pagamento.parcelado ? `${tabela.parcelas}x de ${moeda(b.parcela)}` : null, d.pagamento.pix ? `${moeda(b.pix)} no Pix` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* ações */}
            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                onClick={mandarWhats}
                disabled={salvando}
                className="inline-flex min-h-[56px] items-center justify-between gap-3 rounded-full bg-wa pl-6 pr-2 text-[16px] font-extrabold text-wa-escuro shadow-[0_10px_24px_-14px_rgba(0,0,0,0.5)] transition-transform duration-150 ease-[var(--ease-saida)] active:scale-[0.97] disabled:opacity-60"
              >
                {numero ? 'Enviar no WhatsApp' : 'Enviar no WhatsApp (escolher contato)'}
                <span className="grid h-10 w-10 place-items-center rounded-full bg-wa-escuro/12">
                  <WhatsappLogo className="h-5 w-5" weight="fill" />
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => salvarAgora().then((r) => r && setAviso({ tipo: 'ok', texto: 'Salvo.' }))}
                  disabled={salvando || (!sujo && Boolean(id))}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-tinta text-[14.5px] font-extrabold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-45"
                >
                  {salvando && <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />}
                  {salvando ? 'Salvando…' : sujo || !id ? 'Salvar' : 'Salvo'}
                </button>
                <button
                  type="button"
                  onClick={copiarLink}
                  disabled={salvando}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-[1.5px] border-tinta/20 text-[14.5px] font-extrabold transition-colors hover:border-tinta/50 disabled:opacity-45"
                >
                  <Copy className="h-4 w-4" weight="bold" /> Copiar link
                </button>
              </div>
              {link && !sujo && (
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`${link}/pdf`}
                    download
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[14px] font-bold text-roxo transition-colors hover:bg-lilas-claro"
                  >
                    <FilePdf className="h-4 w-4" weight="bold" /> Baixar PDF
                  </a>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[14px] font-bold text-roxo transition-colors hover:bg-lilas-claro"
                  >
                    Ver online <ArrowSquareOut className="h-4 w-4" weight="bold" />
                  </a>
                </div>
              )}
              {sujo && id && <p className="text-center text-[12.5px] font-semibold text-[#6f6880]">Salve para baixar o PDF com as mudanças.</p>}
            </div>
            {aviso && (
              <p role={aviso.tipo === 'erro' ? 'alert' : 'status'} className={`mt-3 text-center text-[13.5px] font-bold ${aviso.tipo === 'erro' ? 'text-[#c0263f]' : 'text-ok'}`}>
                {aviso.texto}
              </p>
            )}
            {link && (
              <p className="mt-3 select-all break-all rounded-[10px] bg-papel-2 px-3 py-2 text-center text-[12px] text-[#5d5670]">{link}</p>
            )}
          </div>
        </div>

        {/* acompanhamento */}
        {meta && (
          <div className="mt-4 rounded-[24px] border border-white/12 bg-tinta-2 p-5 text-[14px]">
            <ul className="grid gap-2 text-mudo">
              <li>{meta.enviadaEm ? `Enviada em ${dataHora(meta.enviadaEm)}` : 'Ainda não foi enviada.'}</li>
              <li>
                {meta.abertaEm
                  ? `O cliente abriu ${meta.aberturas === 1 ? '1 vez' : `${meta.aberturas} vezes`} · primeira em ${dataHora(meta.abertaEm)}`
                  : 'O cliente ainda não abriu.'}
              </li>
              {meta.aceite && (
                <li className="font-bold text-wa">
                  Aceita por {meta.aceite.nome} em {dataHora(meta.aceite.em)}
                </li>
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={pendente}
                onClick={() => comecar(() => duplicar(meta.id))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 px-3.5 text-[13px] font-bold transition-colors hover:border-white/50"
              >
                <CopySimple className="h-4 w-4" weight="bold" /> Duplicar
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={() => comecar(() => mudarStatus(meta.id, meta.status === 'recusada' || meta.status === 'aceita' ? 'reabrir' : 'recusada'))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 px-3.5 text-[13px] font-bold transition-colors hover:border-white/50"
              >
                {meta.status === 'recusada' || meta.status === 'aceita' ? 'Reabrir proposta' : 'Cliente recusou'}
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={() => {
                  if (confirm(`Apagar a proposta de ${tituloDa(d)}? O link para de funcionar e não dá para desfazer.`)) comecar(() => apagar(meta.id));
                }}
                className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold text-mudo transition-colors hover:bg-white/5 hover:text-erro"
              >
                <Trash className="h-4 w-4" weight="bold" /> Apagar
              </button>
            </div>
          </div>
        )}
        {!meta && (
          <p className="mt-4 px-2 text-[13px] leading-relaxed text-mudo-2">
            Os preços vêm da sua tabela. Para mudar, vá em{' '}
            <Link href="/configuracoes" className="font-bold text-lilas underline underline-offset-4">
              Preços
            </Link>
            .
          </p>
        )}
      </aside>
    </div>
  );
}
