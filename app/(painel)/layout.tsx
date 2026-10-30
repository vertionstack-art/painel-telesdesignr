import Link from 'next/link';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { exigirSessao } from '@/lib/dados';
import { diagnostico } from '@/lib/sql';
import { sair } from '../login/acoes';
import { Marca } from '../marca';
import Navegacao from './navegacao';

export const dynamic = 'force-dynamic';

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  await exigirSessao();
  const banco = await diagnostico();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-tinta/95">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Propostas">
            <Marca className="[&_b]:hidden sm:[&_b]:inline" />
          </Link>
          <Navegacao />
          <form action={sair} className="ml-auto">
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/20 px-3.5 text-[13px] font-bold text-mudo transition-colors hover:border-white/50 hover:text-papel"
            >
              <SignOut className="h-4 w-4" weight="bold" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-10">{banco.ok ? children : <FaltaBanco texto={banco.texto} />}</main>
    </div>
  );
}

/** sem banco, o painel explica o que falta em vez de quebrar */
function FaltaBanco({ texto }: { texto: string }) {
  return (
    <section className="mx-auto max-w-[640px] rounded-[24px] border border-white/12 bg-tinta-2 px-6 py-10 sm:px-10">
      <h1 className="condensada text-[clamp(44px,9vw,72px)]">
        Falta o <span className="marca-texto">banco</span>
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-mudo">{texto}</p>
      <ol className="mt-6 grid gap-3 text-[15px] leading-relaxed">
        <li>
          <b>1.</b> Na Vercel, abra o projeto e clique em <b>Storage</b>.
        </li>
        <li>
          <b>2.</b> <b>Create Database → Neon</b>, plano grátis, e conecte a este projeto.
        </li>
        <li>
          <b>3.</b> Em <b>Deployments</b>, nos três pontinhos do último deploy, clique em <b>Redeploy</b>.
        </li>
      </ol>
      <p className="mt-6 text-[13.5px] text-mudo-2">Depois disso, recarregue esta página. As tabelas são criadas sozinhas.</p>
    </section>
  );
}
