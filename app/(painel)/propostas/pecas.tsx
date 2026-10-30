'use client';

/**
 * As peças do formulário, copiadas do simulador da landing: etapa numerada,
 * pílulas de escolha, cartão de serviço que abre as opções e o contador
 * de − e +.
 */

import { useState } from 'react';
import { Check, Minus, Plus } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export function Etapa({ n, titulo, children, acao }: { n: number; titulo: string; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-[24px] border border-white/12 bg-tinta-2 px-4 pb-5 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
      <legend className="float-left mb-5 flex w-full items-center gap-3 text-[19px] font-extrabold">
        <span aria-hidden="true" className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-roxo text-[15px]">
          {n}
        </span>
        {titulo}
        {acao && <span className="ml-auto">{acao}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function Campo({
  rotulo,
  opcional,
  className = '',
  ...props
}: { rotulo: string; opcional?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[13.5px] font-bold text-[#e6e1ef]">
        {rotulo}
        {opcional && <em className="not-italic font-medium text-mudo"> (opcional)</em>}
      </span>
      <input className="campo" {...props} />
    </label>
  );
}

export function Pilulas<T extends string>({
  nome,
  valor,
  opcoes,
  aoMudar,
  rotulo,
}: {
  nome: string;
  valor: T;
  opcoes: { id: T; rotulo: string; extra?: string }[];
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <label key={o.id} className="relative">
          <input type="radio" name={nome} value={o.id} checked={valor === o.id} onChange={() => aoMudar(o.id)} className="peer absolute h-px w-px opacity-0" />
          <span className="flex min-h-[44px] cursor-pointer select-none items-center rounded-full border-[1.5px] border-white/20 px-4 text-[14.5px] font-semibold transition-[background-color,border-color,transform] duration-150 hover:border-white/40 active:scale-[0.97] peer-checked:border-roxo peer-checked:bg-roxo peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lilas">
            {o.rotulo}
            {o.extra && <small className="ml-1.5 text-[12px] font-bold opacity-75">{o.extra}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** cartão de serviço: marcar abre as opções embaixo */
export function Servico({
  ligado,
  aoMudar,
  icone: Icone,
  titulo,
  detalhe,
  preco,
  children,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  icone: Icon;
  titulo: string;
  detalhe: string;
  preco?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-[18px] border-[1.5px] transition-colors duration-200 ${ligado ? 'border-roxo bg-[#120d1c]' : 'border-white/14 bg-tinta'}`}>
      <label className="flex cursor-pointer select-none items-center gap-3.5 p-4">
        <input type="checkbox" checked={ligado} onChange={(e) => aoMudar(e.target.checked)} className="peer absolute h-px w-px opacity-0" />
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition-colors duration-200 ${ligado ? 'bg-roxo text-white' : 'bg-tinta-3 text-roxo-2'}`}>
          <Icone className="h-[21px] w-[21px]" weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[16.5px] font-extrabold leading-tight">{titulo}</b>
          <small className="mt-0.5 block text-[13px] leading-snug text-mudo">{detalhe}</small>
        </span>
        {preco && <span className="numeros hidden shrink-0 text-[13.5px] font-bold text-mudo sm:block">{preco}</span>}
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border-[1.5px] transition-colors duration-150 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lilas ${
            ligado ? 'border-roxo bg-roxo text-white' : 'border-white/30 text-transparent'
          }`}
        >
          <Check className="h-4 w-4" weight="bold" />
        </span>
      </label>
      {ligado && children && <div className="grid gap-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

/** opção de faixa (Básica / Média / Completa, 5 / 10 / 20 artes) */
export function Opcoes<T extends string>({
  nome,
  valor,
  opcoes,
  aoMudar,
  rotulo,
}: {
  nome: string;
  valor: T;
  opcoes: { id: T; titulo: string; detalhe: string; preco: string }[];
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-3 gap-2">
      {opcoes.map((o) => (
        <label key={o.id} className="relative block cursor-pointer">
          <input type="radio" name={nome} checked={valor === o.id} onChange={() => aoMudar(o.id)} className="peer absolute h-px w-px opacity-0" />
          <span className="flex h-full min-h-[76px] flex-col justify-center rounded-[14px] border-[1.5px] border-white/16 bg-tinta-2 px-3 py-2.5 transition-[border-color,background-color,transform] duration-150 hover:border-white/40 active:scale-[0.98] peer-checked:border-roxo-2 peer-checked:bg-[#1d1330] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lilas">
            <b className="text-[14.5px] font-extrabold">{o.titulo}</b>
            <em className="mt-0.5 text-[12px] not-italic leading-snug text-mudo">{o.detalhe}</em>
            <span className="numeros mt-1.5 text-[12.5px] font-bold text-lilas">{o.preco}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function Contador({
  rotulo,
  detalhe,
  valor,
  min,
  max,
  aoMudar,
}: {
  rotulo: string;
  detalhe?: string;
  valor: number;
  min: number;
  max: number;
  aoMudar: (v: number) => void;
}) {
  const muda = (v: number) => aoMudar(Math.min(Math.max(v, min), max));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[14px] font-semibold leading-tight">
        {rotulo}
        {detalhe && <small className="block text-[12.5px] font-medium text-mudo">{detalhe}</small>}
      </p>
      <div className="flex shrink-0 items-center overflow-hidden rounded-full border-[1.5px] border-white/18">
        <button type="button" onClick={() => muda(valor - 1)} disabled={valor <= min} aria-label={`Menos: ${rotulo}`} className="grid h-[42px] w-[42px] place-items-center transition-colors hover:bg-tinta-3 disabled:opacity-30">
          <Minus className="h-4 w-4" weight="bold" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={valor}
          min={min}
          max={max}
          aria-label={rotulo}
          onChange={(e) => muda(parseInt(e.target.value, 10) || min)}
          className="numeros h-[42px] w-[42px] bg-transparent text-center text-[16px] font-extrabold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" onClick={() => muda(valor + 1)} disabled={valor >= max} aria-label={`Mais: ${rotulo}`} className="grid h-[42px] w-[42px] place-items-center transition-colors hover:bg-tinta-3 disabled:opacity-30">
          <Plus className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}

/** caixinha de liga/desliga com texto (formas de pagamento, item mensal) */
export function Marcador({ ligado, aoMudar, children }: { ligado: boolean; aoMudar: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 text-[14.5px] font-semibold">
      <input type="checkbox" checked={ligado} onChange={(e) => aoMudar(e.target.checked)} className="peer absolute h-px w-px opacity-0" />
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border-[1.5px] transition-colors duration-150 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lilas ${
          ligado ? 'border-roxo bg-roxo text-white' : 'border-white/30 text-transparent'
        }`}
      >
        <Check className="h-3.5 w-3.5" weight="bold" />
      </span>
      <span>{children}</span>
    </label>
  );
}

/**
 * Campo de dinheiro: guarda o texto como foi digitado (com vírgula) e só
 * devolve o número. Converter a cada tecla apagaria a vírgula no meio.
 */
export function CampoValor({
  valor,
  aoMudar,
  ...props
}: { valor: number | null; aoMudar: (n: number | null) => void; rotulo: string; opcional?: boolean } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>) {
  const [texto, setTexto] = useState(valor ? String(valor).replace('.', ',') : '');
  return (
    <Campo
      {...props}
      inputMode="decimal"
      value={texto}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,]/g, '');
        setTexto(t);
        const n = Number(t.replace(/\./g, '').replace(',', '.'));
        aoMudar(Number.isFinite(n) && n > 0 ? n : null);
      }}
    />
  );
}
