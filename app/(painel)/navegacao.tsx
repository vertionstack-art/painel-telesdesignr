'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** o menu branco em pílula da hero da landing, com o item da vez em roxo */
const ITENS = [
  { href: '/', rotulo: 'Propostas', ativo: (p: string) => p === '/' || (p.startsWith('/propostas/') && p !== '/propostas/nova') },
  { href: '/propostas/nova', rotulo: 'Nova', ativo: (p: string) => p === '/propostas/nova' },
  { href: '/configuracoes', rotulo: 'Preços', ativo: (p: string) => p.startsWith('/configuracoes') },
];

export default function Navegacao() {
  const p = usePathname();
  return (
    <nav aria-label="Painel" className="flex h-11 items-center rounded-full bg-white p-1 text-tinta shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)]">
      {ITENS.map((i) => {
        const on = i.ativo(p);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={on ? 'page' : undefined}
            className={`grid h-full place-items-center rounded-full px-3.5 text-[13.5px] font-bold transition-colors duration-200 sm:px-4 ${
              on ? 'bg-roxo text-white' : 'hover:text-roxo'
            }`}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
