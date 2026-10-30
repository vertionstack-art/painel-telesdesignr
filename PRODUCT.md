# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: Next.js 16 + Tailwind v4 + Postgres (postgres.js), the same stack as the Vertion Leads proposal tool the owner already uses, hosted on Vercel (repo vertionstack-art/painel-telesdesignr). Database is Neon free, installed through Vercel's Storage tab, because the owner's Supabase account already has its two free projects. The app creates its own tables on first run, so no database password is ever handled outside Vercel.

## Users

- **Lucas (Teles Designr):** a graphic designer, social media manager and video editor in Rio de Janeiro, working since 2014. He is a layperson in programming. He builds commercial proposals for design clients and today writes them by hand in WhatsApp. He is the only person who logs into the panel.
- **His clients:** local businesses, churches and events, professionals and people just starting out (the audience named on the landing). They open the proposal from a link, usually on their phone, straight from WhatsApp.

## Product Purpose

The panel replaces proposals written by hand in WhatsApp. Lucas fills in the client's details and picks the services. The panel works out the price using his own price table. It then produces a proposal page with his brand that he sends as a link. Success means three things: sending a proposal takes minutes, the client receives something that looks professional, and Lucas can see who opened it and who accepted.

## Positioning

The proposal speaks with the same identity and prices as the telesdesignr landing, so what the client sees in the proposal matches what they saw on the website.

## Operating Context

- **Prices come from the landing's simulator.** These are in the PRECOS block of telesdesignr/index.html:
  - Identity: Básica, Média, Completa ("a partir de").
  - Art packs: 5, 10 or 20.
  - Video packs: 4, 8 or 12.
  - Social media management: 2, 3 or 5 posts a week, plus carousels and Reels.
  - On-site recording, per day.
  - A multiplier by client profile.
  - Combo: 10% off when there are 2 or more services, not applied to recording days.
  - Up to 12 payments with no interest.
  - Prices never end in ",00".
- **Prices can be edited** in the panel's settings.
- **The proposal is sent by link through WhatsApp,** with Lucas's own click.

## Capabilities and Constraints

- **Login:** a single password (an environment variable that Lucas sets in Vercel himself).
- **Payment terms on offer:**
  - 50% on approval and 50% on delivery.
  - Up to 12x with no interest on a card.
  - Pix in full with a discount (the % is set in settings).
  - Monthly, for recurring services.
- **Validity:** proposals have no validity date and do not show one.
- **Free-form items:** any service with a name and price typed in on the spot. This includes websites, which he also sells through Vertion Stack.
- **Online acceptance:** the client accepts by typing their name, and the panel shows it. This carries over from the Vertion Leads tool, which this replaces as the model.

## Brand Commitments

- **Name and contact:**
  - Teles Designr.
  - WhatsApp (21) 96019-4636; Instagram @teles.designr; Rio de Janeiro; "desde 2014".
- **Voice:** direct and first person ("você fala direto comigo"). Taglines: "Design com propósito" and "Entrego mais do que o combinado".
- **Visual identity:** the landing at vertionstack-art/telesdesignr, which is binding. The photo is img/teles-designr.webp.

## Evidence on Hand

- **Real assets:** the landing copy, the price table, Lucas's photo and his contact details.
- **Proof that does not exist:** there are no testimonials, client logos, case numbers or portfolio images in the repo. Never fabricate them.

## Product Principles

1. The price shown is always the one the table calculates, or one Lucas typed in. The panel never invents a value.
2. Fewer fields, more defaults: making a proposal should feel faster than writing a WhatsApp message.
3. The client's page must read well on an old phone inside WhatsApp's browser.
4. Nothing is sent without Lucas's click.
