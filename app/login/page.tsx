import type { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, senhaConfigurada, sessaoValida } from '@/lib/sessao';
import { Marca } from '../marca';
import FormLogin from './form';

export const metadata: Metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  const c = await cookies();
  const { volta } = await searchParams;
  const destino = volta && volta.startsWith('/') && !volta.startsWith('//') ? volta : '/';
  if (await sessaoValida(c.get(COOKIE)?.value)) redirect(destino);

  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-[#070707] lg:grid-cols-[1fr_minmax(0,560px)]">
      <section className="relative z-10 flex flex-col justify-between px-5 pb-10 pt-6 sm:px-10 lg:px-14 lg:py-12">
        <Marca />
        <div className="mt-16 max-w-[460px] lg:mt-0">
          <h1 className="larga text-[clamp(64px,16vw,112px)] uppercase leading-[0.86] tracking-[-0.06em]">
            <span className="block">Painel</span>
            <span className="block text-roxo">Propostas</span>
          </h1>
          <p className="mt-6 max-w-[34ch] text-[16px] font-medium leading-relaxed text-mudo">
            Monte a proposta, mande o link pelo WhatsApp e veja quando o cliente abriu e aceitou.
          </p>
          {senhaConfigurada() ? (
            <FormLogin destino={destino} />
          ) : (
            <p role="alert" className="mt-8 rounded-[14px] border border-white/15 bg-tinta-2 p-4 text-[14px] leading-relaxed text-mudo">
              Falta cadastrar a senha. Na Vercel, abra o projeto → <b className="text-papel">Settings → Environment Variables</b> e
              crie <b className="text-papel">PAINEL_SENHA</b> com uma senha de pelo menos 6 caracteres. Depois, faça um Redeploy.
            </p>
          )}
        </div>
        <p className="mt-16 text-[12.5px] font-semibold text-mudo-2">Rio de Janeiro · desde 2014</p>
      </section>

      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[-30%] w-[90%] opacity-35 sm:right-[-10%] sm:w-[70%] lg:static lg:w-auto lg:opacity-100">
        <Image
          src="/img/teles-designr.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 560px, 70vw"
          className="object-cover object-top [mask-image:linear-gradient(90deg,transparent,#000_22%)]"
        />
      </div>
    </main>
  );
}
