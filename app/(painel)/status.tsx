import type { Status } from '@/lib/dados';

export const ROTULO_STATUS: Record<Status, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aberta: 'Aberta',
  aceita: 'Aceita',
  recusada: 'Recusada',
};

const COR: Record<Status, string> = {
  rascunho: 'bg-tinta-3 text-mudo',
  enviada: 'bg-white/10 text-papel',
  aberta: 'bg-lilas text-tinta',
  aceita: 'bg-wa text-wa-escuro',
  recusada: 'border border-white/15 text-mudo-2',
};

export function Selo({ status }: { status: Status }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold ${COR[status]}`}>
      {status === 'aberta' && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-roxo" />}
      {ROTULO_STATUS[status]}
    </span>
  );
}
