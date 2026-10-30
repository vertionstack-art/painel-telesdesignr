import Link from 'next/link';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { exigirSessao } from '@/lib/dados';
import { sair } from '../login/acoes';
import { Marca } from '../marca';
import Navegacao from './navegacao';

export const dynamic = 'force-dynamic';

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  await exigirSessao();
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
      <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
