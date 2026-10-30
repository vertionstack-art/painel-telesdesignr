'use client';

import { useState } from 'react';
import { ArrowRight, CircleNotch, WhatsappLogo } from '@phosphor-icons/react';
import { linkWhats } from '@/lib/contato';

/** o cliente escreve o nome e aceita; depois, um toque avisa no WhatsApp */
export default function Aceite({ id, token, titulo, nomeSugerido }: { id: string; token: string; titulo: string; nomeSugerido: string }) {
  const [nome, setNome] = useState(nomeSugerido);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aceito, setAceito] = useState<string | null>(null);

  async function aceitar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch('/api/p/aceite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, nome }) });
      const j = await r.json().catch(() => ({ ok: false }));
      if (!j.ok) throw new Error(j.erro || 'Não deu certo. Tente de novo.');
      setAceito(j.aceite?.nome || nome);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (aceito) {
    return (
      <div id="aceitar" className="scroll-mt-6 rounded-[14px] bg-[#e3f5ea] p-4 text-[#14532d]">
        <p className="text-[16px] font-extrabold">Proposta aceita. Obrigado, {aceito.split(' ')[0]}!</p>
        <p className="mt-1 text-[14.5px] leading-relaxed">Já fiquei sabendo. Se quiser adiantar, me avisa no WhatsApp e a gente combina o começo.</p>
        <a
          href={linkWhats(`Oi, Lucas! Aceitei a proposta para ${titulo}. Vamos começar?`)}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-wa px-5 text-[15px] font-extrabold text-wa-escuro"
        >
          <WhatsappLogo className="h-5 w-5" weight="fill" /> Avisar no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form id="aceitar" onSubmit={aceitar} className="scroll-mt-6 grid gap-2.5">
      <label className="grid gap-1.5">
        <span className="text-[14px] font-bold">Seu nome completo</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          minLength={3}
          autoComplete="name"
          aria-invalid={Boolean(erro)}
          className="min-h-[52px] w-full rounded-[14px] border-[1.5px] border-[#d9d2e8] bg-white px-4 text-[16px] text-tinta outline-none transition-colors focus:border-roxo"
        />
      </label>
      {erro && (
        <p role="alert" className="text-[13.5px] font-bold text-[#c0263f]">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-[56px] items-center justify-between gap-3 rounded-full bg-roxo pl-6 pr-2 text-[16px] font-extrabold text-white transition-transform duration-150 ease-[var(--ease-saida)] active:scale-[0.97] disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Aceitar proposta'}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/16">
          {enviando ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" /> : <ArrowRight className="h-5 w-5" weight="bold" />}
        </span>
      </button>
      <p className="text-center text-[12.5px] text-[#6f6880]">Aceitar não cobra nada agora. O pagamento a gente combina em seguida.</p>
    </form>
  );
}
