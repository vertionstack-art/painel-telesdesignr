'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Eye, MagnifyingGlass } from '@phosphor-icons/react';
import type { Status } from '@/lib/dados';
import { moeda } from '@/lib/precos';
import { haQuanto } from '@/lib/formato';
import { ROTULO_STATUS, Selo } from './status';

export interface Linha {
  id: string;
  titulo: string;
  pessoa: string;
  perfil: string;
  cidade: string;
  servicos: string[];
  unico: number;
  mensal: number;
  aPartir: boolean;
  status: Status;
  atualizadaEm: string;
  abertaEm: string | null;
  aberturas: number;
  aceite: { nome: string; em: string } | null;
}

type Filtro = 'todas' | Status;
const FILTROS: Filtro[] = ['todas', 'rascunho', 'enviada', 'aberta', 'aceita', 'recusada'];

function valor(l: Linha) {
  const partes = [l.unico ? `${l.aPartir ? 'a partir de ' : ''}${moeda(l.unico)}` : null, l.mensal ? `${moeda(l.mensal)}/mês` : null].filter(Boolean);
  return partes.join(' + ') || '—';
}

export default function Lista({ linhas }: { linhas: Linha[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busca, setBusca] = useState('');

  const conta = useMemo(() => {
    const c = { todas: linhas.length } as Record<Filtro, number>;
    for (const f of FILTROS.slice(1)) c[f] = linhas.filter((l) => l.status === f).length;
    return c;
  }, [linhas]);

  const vista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return linhas
      .filter((l) => filtro === 'todas' || l.status === filtro)
      .filter((l) => !q || [l.titulo, l.pessoa, l.cidade, ...l.servicos].some((x) => x.toLowerCase().includes(q)));
  }, [linhas, filtro, busca]);

  // o que está na mesa: aceitas e as que o cliente já abriu
  const aceitas = linhas.filter((l) => l.status === 'aceita');
  const somaAceita = aceitas.reduce((s, l) => s + l.unico, 0);
  const mensalAceito = aceitas.reduce((s, l) => s + l.mensal, 0);

  if (!linhas.length) {
    return (
      <section className="mt-10 rounded-[24px] border border-white/12 bg-tinta-2 px-6 py-14 text-center sm:px-10">
        <h2 className="condensada text-[44px] sm:text-[56px]">
          Sua primeira <span className="marca-texto">proposta</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-mudo">
          Coloque os dados do cliente, marque os serviços e o valor sai sozinho, com os preços da sua landing. Depois é só mandar o link no WhatsApp.
        </p>
        <Link
          href="/propostas/nova"
          className="mt-8 inline-flex min-h-[52px] items-center rounded-full bg-roxo px-7 text-[15px] font-extrabold text-white"
        >
          Montar proposta
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8">
      {aceitas.length > 0 && (
        <p className="mb-6 text-[15px] font-semibold text-mudo">
          {aceitas.length} {aceitas.length === 1 ? 'proposta aceita' : 'propostas aceitas'}:{' '}
          <b className="numeros text-papel">{[somaAceita ? moeda(somaAceita) : null, mensalAceito ? `${moeda(mensalAceito)}/mês` : null].filter(Boolean).join(' + ')}</b>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Filtrar por situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filtro === f}
              onClick={() => setFiltro(f)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 text-[13.5px] font-bold transition-colors duration-150 ${
                filtro === f ? 'border-roxo bg-roxo text-white' : 'border-white/20 text-papel hover:border-white/45'
              }`}
            >
              {f === 'todas' ? 'Todas' : ROTULO_STATUS[f]}
              <span className={`numeros text-[12px] ${filtro === f ? 'text-white/80' : 'text-mudo-2'}`}>{conta[f]}</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto w-full sm:w-[280px]">
          <span className="sr-only">Procurar proposta</span>
          <MagnifyingGlass aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mudo-2" weight="bold" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Cliente, cidade ou serviço…"
            className="campo h-10 min-h-0 rounded-full pl-10 text-[14px]"
          />
        </label>
      </div>

      {vista.length === 0 ? (
        <p className="mt-6 rounded-[24px] border border-white/12 px-6 py-10 text-center text-[15px] text-mudo">Nenhuma proposta com esse filtro.</p>
      ) : (
        <ul className="mt-5 overflow-hidden rounded-[24px] border border-white/12 bg-tinta-2">
          {vista.map((l) => (
            <li key={l.id} className="border-t border-white/10 first:border-t-0">
              <Link
                href={`/propostas/${l.id}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.035] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto] md:px-6"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[16.5px] font-extrabold">{l.titulo}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-mudo">
                    {[l.pessoa, l.perfil, l.cidade].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
                  <span className="numeros block text-[15px] font-extrabold">{valor(l)}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-mudo-2">{l.servicos.join(' · ') || 'Nenhum serviço marcado'}</span>
                </span>
                <span className="col-start-2 row-start-1 flex flex-col items-end gap-1 md:col-start-auto md:row-start-auto">
                  <Selo status={l.status} />
                  <span className="text-[12px] font-semibold text-mudo-2">
                    {l.status === 'aceita' && l.aceite
                      ? `por ${l.aceite.nome.split(' ')[0]} · ${haQuanto(l.aceite.em)}`
                      : l.abertaEm
                        ? (
                            <span className="inline-flex items-center gap-1">
                              <Eye aria-hidden className="h-3.5 w-3.5" weight="bold" />
                              {l.aberturas}× · {haQuanto(l.abertaEm)}
                            </span>
                          )
                        : `editada ${haQuanto(l.atualizadaEm)}`}
                  </span>
                </span>
                <span aria-hidden className="hidden h-10 w-10 place-items-center rounded-full bg-white/[0.06] transition-transform duration-200 ease-[var(--ease-saida)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:grid">
                  <ArrowUpRight className="h-4 w-4" weight="bold" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
