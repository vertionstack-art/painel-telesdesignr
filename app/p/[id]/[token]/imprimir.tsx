import { FilePdf } from '@phosphor-icons/react/dist/ssr';

/** baixa a proposta como arquivo PDF (gerado no servidor, funciona no celular e dentro do WhatsApp) */
export default function Imprimir({ href }: { href: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-[1.5px] border-white/25 px-5 text-[14px] font-bold transition-colors hover:border-white/60"
    >
      <FilePdf className="h-5 w-5" weight="bold" /> Baixar PDF
    </a>
  );
}
