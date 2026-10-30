import type { Metadata } from 'next';
import { tabelaAtual } from '@/lib/dados';
import { PROPOSTA_VAZIA } from '@/lib/precos';
import { iaConfigurada } from '@/lib/recado';
import Editor from '../editor';

export const metadata: Metadata = { title: 'Nova proposta' };

export default async function NovaProposta() {
  return (
    <>
      <h1 className="condensada mb-8 text-[clamp(52px,10vw,96px)]">
        Nova <span className="marca-texto">proposta</span>
      </h1>
      <Editor inicial={PROPOSTA_VAZIA} tabela={await tabelaAtual()} meta={null} iaLigada={iaConfigurada()} />
    </>
  );
}
