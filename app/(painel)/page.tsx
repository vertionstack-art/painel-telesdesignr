import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { listarPropostas } from '@/lib/dados';
import { calcular, tituloDa } from '@/lib/precos';
import Lista, { type Linha } from './lista';

export const metadata: Metadata = { title: 'Propostas' };

export default async function PaginaPropostas() {
  const propostas = await listarPropostas();
  const linhas: Linha[] = propostas.map((p) => {
    const c = calcular(p.dados, p.tabela);
    return {
      id: p.id,
      titulo: tituloDa(p.dados),
      pessoa: p.dados.cliente.negocio.trim() ? p.dados.cliente.nome.trim() : '',
      perfil: c.perfil.nome,
      cidade: p.dados.cliente.cidade,
      servicos: c.linhas.map((l) => l.nome),
      unico: c.unico?.total ?? 0,
      mensal: c.mensal?.total ?? 0,
      aPartir: c.aPartir,
      status: p.status,
      atualizadaEm: p.atualizadaEm,
      abertaEm: p.abertaEm,
      aberturas: p.aberturas,
      aceite: p.aceite,
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="condensada text-[clamp(56px,11vw,104px)]">
          Propos<span className="text-roxo">tas</span>
        </h1>
        <Link
          href="/propostas/nova"
          className="inline-flex min-h-[52px] items-center gap-3 rounded-full bg-roxo pl-6 pr-2 text-[15px] font-extrabold text-white transition-transform duration-150 ease-[var(--ease-saida)] active:scale-[0.97]"
        >
          Nova proposta
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
            <Plus className="h-[18px] w-[18px]" weight="bold" />
          </span>
        </Link>
      </div>
      <Lista linhas={linhas} />
    </>
  );
}
