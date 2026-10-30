'use client';

import { FilePdf } from '@phosphor-icons/react';

export default function Imprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-[1.5px] border-white/25 px-5 text-[14px] font-bold transition-colors hover:border-white/60"
    >
      <FilePdf className="h-5 w-5" weight="bold" /> Salvar em PDF
    </button>
  );
}
