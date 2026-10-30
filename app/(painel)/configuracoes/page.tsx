import type { Metadata } from 'next';
import { tabelaAtual } from '@/lib/dados';
import FormPrecos from './form';

export const metadata: Metadata = { title: 'Preços' };

export default async function PaginaPrecos() {
  return (
    <>
      <h1 className="condensada text-[clamp(56px,11vw,104px)]">
        Sua <span className="marca-texto">tabela</span>
      </h1>
      <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-mudo">
        Começa igual ao simulador da landing. Mudar aqui vale para as propostas novas e para as que você editar e salvar de novo; as que já foram
        mandadas continuam com o preço da época.
      </p>
      <FormPrecos inicial={await tabelaAtual()} />
    </>
  );
}
