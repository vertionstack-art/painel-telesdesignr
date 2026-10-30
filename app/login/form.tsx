'use client';

import { useActionState } from 'react';
import { ArrowRight, CircleNotch } from '@phosphor-icons/react';
import { entrar } from './acoes';

export default function FormLogin({ destino }: { destino: string }) {
  const [estado, acao, enviando] = useActionState(entrar, null);
  return (
    <form action={acao} className="mt-8 grid gap-3">
      <input type="hidden" name="volta" value={destino} />
      <label className="grid gap-2">
        <span className="text-[13.5px] font-bold">Senha do painel</span>
        <input
          name="senha"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={Boolean(estado?.erro)}
          aria-describedby={estado?.erro ? 'erro-login' : undefined}
          className="campo min-h-[56px] text-[16px]"
        />
      </label>
      {estado?.erro && (
        <p id="erro-login" role="alert" className="text-[13.5px] font-semibold text-erro">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-1 inline-flex min-h-[56px] items-center justify-between gap-3 rounded-full bg-roxo pl-6 pr-2 text-[16px] font-extrabold text-white transition-transform duration-150 ease-[var(--ease-saida)] active:scale-[0.97] disabled:opacity-60"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
          {enviando ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" /> : <ArrowRight className="h-5 w-5" weight="bold" />}
        </span>
      </button>
    </form>
  );
}
