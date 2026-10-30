# Painel Teles Designr

O painel de propostas comerciais do Teles Designr. Você preenche o cliente, marca os serviços, e o valor sai pela tabela de preços da landing. Depois manda o link pelo WhatsApp e acompanha quando o cliente abriu e aceitou.

## Telas

- **Propostas** (`/`): a lista de propostas, com filtro por situação (rascunho, enviada, aberta, aceita, recusada) e busca.
- **Nova** (`/propostas/nova`): o editor, organizado assim:
  1. Cliente.
  2. Serviços da landing.
  3. Itens à parte (inclusive o site pela Vertion Stack).
  4. Pagamento e prazo.
  5. Recado para o cliente.

  Ao lado fica o resumo com o valor ao vivo e os botões Enviar no WhatsApp, Salvar e Copiar link. O atalho Ctrl+S salva.
- **Preços** (`/configuracoes`): a tabela de preços. Ela começa igual ao simulador da landing, e mudar aqui não altera propostas já enviadas.
- **Proposta do cliente** (`/p/<id>/<código>`): a página que o cliente abre, com a identidade da landing. Tem botão de aceitar, botão de tirar dúvida no WhatsApp e opção de salvar em PDF.

## Colocar no ar (Vercel)

1. Em vercel.com, clique em **Add New → Project** e importe o repositório `vertionstack-art/painel-telesdesignr`. Clique em **Deploy** (o primeiro deploy pode mostrar erro de banco, é normal).
2. No projeto, abra **Storage → Create Database → Neon (Postgres)**. Escolha o plano grátis e conecte ao projeto. Isso cria sozinho a variável `DATABASE_URL`.
3. Em **Settings → Environment Variables**, crie `PAINEL_SENHA` com a senha que você quer usar para entrar (6 caracteres ou mais).
4. Em **Deployments**, clique nos três pontinhos do último deploy e depois em **Redeploy**.

As tabelas do banco nascem sozinhas no primeiro acesso.

## Rodar no PC

Crie um `.env.local` com `DATABASE_URL` e `PAINEL_SENHA`, e então rode:

```
npm install
npm run dev
```
