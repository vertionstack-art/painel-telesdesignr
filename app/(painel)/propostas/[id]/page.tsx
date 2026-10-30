import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { buscarProposta, tabelaAtual } from '@/lib/dados';
import { tituloDa } from '@/lib/precos';
import Editor from '../editor';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await buscarProposta((await params).id.slice(0, 40));
  return { title: p ? tituloDa(p.dados) : 'Proposta' };
}

export default async function EditarProposta({ params }: Props) {
  const p = await buscarProposta((await params).id.slice(0, 40));
  if (!p) notFound();
  return (
    <>
      <Link href="/" className="inline-flex min-h-[40px] items-center gap-1.5 text-[13.5px] font-bold text-mudo transition-colors hover:text-papel">
        <ArrowLeft className="h-4 w-4" weight="bold" /> Propostas
      </Link>
      <h1 className="condensada mb-8 mt-2 break-words text-[clamp(44px,9vw,88px)]">{tituloDa(p.dados)}</h1>
      <Editor
        key={p.id}
        inicial={p.dados}
        tabela={await tabelaAtual()}
        meta={{ id: p.id, token: p.token, status: p.status, abertaEm: p.abertaEm, aberturas: p.aberturas, aceite: p.aceite, enviadaEm: p.enviadaEm }}
      />
    </>
  );
}
