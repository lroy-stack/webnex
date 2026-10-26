# webnex — modular SaaS for web development client management

A prototype from May 2025. It began in Lovable (`lovable-tagger` in `package.json`) and was continued in Bolt (`.bolt/` folder with discarded Supabase migrations). It is the larger successor of `modulkar-web-studio-core`: a Spanish-language platform where a web studio sells packs and modules and manages clients and projects.

## What it does

- Public site: home, packs, services, contact, cart, order confirmation, privacy and terms.
- Client side: dashboard, project progress and updates, real-time chat with the studio, onboarding form and welcome modals.
- Admin side: clients, services, packs, projects, chat, carts, analytics dashboard, configuration, user management and tools.
- Supabase back end: auth, Postgres schema reference, Edge Functions, and shell scripts to back up, restore and export the database and to create an admin user.
- `GUMROAD_README.md` is a Spanish sales description, so it was meant to be packaged as a product.

## Built with

Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Query, Framer Motion, Supabase.

## Run it locally

```bash
git clone https://github.com/lroy-stack/webnex.git
cd webnex
npm install
npm run dev
```

You need your own Supabase project; `DB_README.md` and `setup_webnex_db.sh` describe the database setup.

Status: archived prototype, not maintained.

---

Prototipo de mayo 2025, empezado en Lovable y seguido en Bolt: plataforma SaaS modular para que un estudio web venda packs y gestione clientes, proyectos y chat, sobre Supabase. Es la versión ampliada de `modulkar-web-studio-core`.
