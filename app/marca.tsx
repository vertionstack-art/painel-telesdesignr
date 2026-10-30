/** a placa da landing: dois triângulos (roxo e branco) e o nome em Archivo larga */
export function Simbolo({ className = 'h-[22px] w-[25px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 30" aria-hidden="true" className={className}>
      <path d="M0 30 L13 4 L20 18 Z" fill="#8b2cff" />
      <path d="M15 30 L26 8 L34 30 Z" fill="currentColor" />
    </svg>
  );
}

export function Marca({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo />
      <b className="larga text-[15px] tracking-[0.03em] [font-stretch:118%]">TELES DESIGNR</b>
    </span>
  );
}
