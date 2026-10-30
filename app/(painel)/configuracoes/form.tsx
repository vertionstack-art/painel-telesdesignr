'use client';

import { useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { IDENTIDADES, PERFIS, TABELA_PADRAO, type Tabela } from '@/lib/precos';
import { salvarPrecos } from '../acoes';

/** número digitado com vírgula vira número; vazio vira 0 */
const lerNumero = (v: string) => Number(v.replace(/\./g, '').replace(',', '.')) || 0;
const mostrar = (n: number) => (n ? String(n).replace('.', ',') : '');

function Preco({ rotulo, valor, aoMudar, sufixo = 'R$' }: { rotulo: string; valor: number; aoMudar: (n: number) => void; sufixo?: string }) {
  const [texto, setTexto] = useState(mostrar(valor));
  return (
    <label className="flex items-center justify-between gap-4 border-t border-white/10 py-3 first:border-t-0">
      <span className="text-[14.5px] font-semibold">{rotulo}</span>
      <span className="relative w-[150px] shrink-0">
        <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-mudo-2">
          {sufixo}
        </span>
        <input
          inputMode="decimal"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            aoMudar(lerNumero(e.target.value));
          }}
          className="campo numeros pl-11 text-right font-bold"
        />
      </span>
    </label>
  );
}

function Bloco({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return (
    <section className="rounded-[24px] border border-white/12 bg-tinta-2 px-5 pb-3 pt-5 sm:px-7">
      <h2 className="text-[18px] font-extrabold">{titulo}</h2>
      {nota && <p className="mt-1 text-[13px] leading-snug text-mudo">{nota}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function FormPrecos({ inicial }: { inicial: Tabela }) {
  const [t, setT] = useState(inicial);
  const [versao, setVersao] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const muda = (f: (x: Tabela) => Tabela) => {
    setT(f);
    setAviso(null);
  };

  async function salvar() {
    setSalvando(true);
    const r = await salvarPrecos(t);
    setSalvando(false);
    setAviso(r.ok ? { ok: true, texto: 'Preços salvos.' } : { ok: false, texto: r.erro || 'Não deu certo.' });
  }

  return (
    <div key={versao} className="mt-8 grid items-start gap-4 lg:grid-cols-2">
      <Bloco titulo="Identidade visual">
        {IDENTIDADES.map((i) => (
          <Preco
            key={i}
            rotulo={`${t.identidade[i].nome}${t.identidade[i].aPartir ? ' (a partir de)' : ''}`}
            valor={t.identidade[i].v}
            aoMudar={(v) => muda((x) => ({ ...x, identidade: { ...x.identidade, [i]: { ...x.identidade[i], v } } }))}
          />
        ))}
      </Bloco>

      <Bloco titulo="Pacotes de artes">
        {Object.keys(t.artes).map((q) => (
          <Preco key={q} rotulo={`${q} artes`} valor={t.artes[q]} aoMudar={(v) => muda((x) => ({ ...x, artes: { ...x.artes, [q]: v } }))} />
        ))}
      </Bloco>

      <Bloco titulo="Pacotes de vídeos">
        {Object.keys(t.videos).map((q) => (
          <Preco key={q} rotulo={`${q} vídeos`} valor={t.videos[q]} aoMudar={(v) => muda((x) => ({ ...x, videos: { ...x.videos, [q]: v } }))} />
        ))}
      </Bloco>

      <Bloco titulo="Gestão de redes (por mês)">
        {Object.keys(t.redes.planos).map((q) => (
          <Preco
            key={q}
            rotulo={`${q} posts por semana`}
            valor={t.redes.planos[q]}
            aoMudar={(v) => muda((x) => ({ ...x, redes: { ...x.redes, planos: { ...x.redes.planos, [q]: v } } }))}
          />
        ))}
        <Preco rotulo="Cada carrossel a mais" valor={t.redes.carrossel} aoMudar={(v) => muda((x) => ({ ...x, redes: { ...x.redes, carrossel: v } }))} />
        <Preco rotulo="Cada Reels a mais" valor={t.redes.reels} aoMudar={(v) => muda((x) => ({ ...x, redes: { ...x.redes, reels: v } }))} />
      </Bloco>

      <Bloco titulo="Ajuste por perfil" nota="Multiplica o preço da tabela. 1 = sem ajuste; 1,15 = 15% a mais.">
        {PERFIS.map((p) => (
          <Preco
            key={p}
            rotulo={t.perfis[p].nome}
            sufixo="×"
            valor={t.perfis[p].k}
            aoMudar={(k) => muda((x) => ({ ...x, perfis: { ...x.perfis, [p]: { ...x.perfis[p], k: k || 1 } } }))}
          />
        ))}
      </Bloco>

      <Bloco titulo="Gravação, descontos e parcelas">
        <Preco rotulo="Diária de gravação" valor={t.diaria} aoMudar={(v) => muda((x) => ({ ...x, diaria: v }))} />
        <Preco rotulo="Combo, 2 serviços ou mais" sufixo="%" valor={Math.round(t.combo * 100)} aoMudar={(v) => muda((x) => ({ ...x, combo: Math.min(v, 90) / 100 }))} />
        <Preco rotulo="Desconto no Pix à vista" sufixo="%" valor={Math.round(t.pix * 100)} aoMudar={(v) => muda((x) => ({ ...x, pix: Math.min(v, 90) / 100 }))} />
        <Preco rotulo="Parcelas sem juros" sufixo="até" valor={t.parcelas} aoMudar={(v) => muda((x) => ({ ...x, parcelas: Math.max(1, Math.round(v)) }))} />
      </Bloco>

      <div className="sticky bottom-4 z-10 flex items-center gap-2 rounded-full border border-white/16 bg-tinta-2/95 p-2 pl-5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] lg:col-span-2">
        {aviso && (
          <p role="status" className={`text-[13px] font-bold sm:hidden ${aviso.ok ? 'text-wa' : 'text-erro'}`}>
            {aviso.ok ? 'Salvo' : 'Erro'}
          </p>
        )}
        <p role="status" className={`hidden text-[14px] font-bold sm:block ${aviso ? (aviso.ok ? 'text-wa' : 'text-erro') : 'text-mudo'}`}>
          {aviso?.texto || 'Os preços nunca terminam em ,00 na proposta.'}
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Voltar todos os preços para os da landing?')) {
              setT(TABELA_PADRAO);
              setVersao((v) => v + 1);
              setAviso(null);
            }
          }}
          className="inline-flex min-h-[44px] items-center rounded-full px-3 text-[13px] font-bold text-mudo transition-colors hover:text-papel sm:ml-auto sm:px-4 sm:text-[13.5px]"
        >
          Voltar aos da landing
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="ml-auto inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-roxo px-5 text-[15px] sm:ml-0 sm:px-6 font-extrabold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
        >
          {salvando && <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />}
          Salvar preços
        </button>
      </div>
    </div>
  );
}
