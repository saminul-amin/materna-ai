# Materna AI — Explainable AI for Maternal Health Monitoring & Decision Support

**From First Trimester to Delivery — Monitoring, Care Coordination, Emergency Access, and Everyday Wellbeing in One Platform**

![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

**Live demo:** https://materna-ai-silk.vercel.app (Vercel + Neon Postgres, synthetic demo data — click **Try Demo**)

> **Medical safety disclaimer.** Materna AI is a prototype for maternal health monitoring and decision support. It is **not** a diagnostic system, does **not** prescribe treatment, and does **not** replace qualified healthcare professionals or antenatal care. All AI observations are information to discuss with a qualified professional. In an emergency in Bangladesh, call **999**. The trend thresholds in this MVP are **Prototype/Demo Logic — Not for Clinical Use**.

Functional MVP built for a university-level national AI startup competition demonstration. Uses **synthetic demo data only** — no real patients, providers, facilities, pharmacies or partnerships.

---

## Contents

1. [Stack](#stack)
2. [Quick start](#quick-start)
3. [Demo patient & credentials](#demo-patient--credentials)
4. [Summit demo flow (3–5 min)](#summit-demo-flow-35-min)
5. [Project structure](#project-structure)
6. [Database schema](#database-schema)
7. [Environment variables](#environment-variables)
8. [API overview](#api-overview)
9. [Deployment](#deployment)
10. [Implemented MVP features](#implemented-mvp-features)
11. [Simulated / demo features](#simulated--demo-features)
12. [Future production features](#future-production-features)
13. [Safety, privacy and AI design](#safety-privacy-and-ai-design)

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, lucide-react |
| Backend | Next.js API route handlers (same deployable), Zod validation |
| Database | Prisma ORM. **SQLite by default** (zero infrastructure). One-line switch to **PostgreSQL / Supabase**. |
| Auth | bcrypt password hashing + signed HttpOnly session cookie (jose / HS256), route middleware |
| AI | Transparent rule-based trend engine (no black box). Optional LLM assistant via Anthropic SDK; rule-based prototype fallback |
| Documents | Server-side file storage, PDF text extraction (`pdf-parse`), conservative pattern detection, demo extraction for synthetic documents |

## Quick start

Requirements: Node.js 18.18+ (tested on Node 24), npm.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # edit SESSION_SECRET (any long random string)
npx prisma db push          # creates prisma/dev.db (SQLite)
npm run dev                 # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Other commands: `npm run typecheck`, `npm run db:studio` (browse the DB), `npm run db:push`.

**Low-memory machines / live demo tip.** The dev server (Turbopack) compiles pages on demand and can exhaust system resources on small laptops (symptoms: "Array buffer allocation failed" or "OS can't spawn worker thread"). For the competition demo, run the production build instead — it is faster and far lighter:

```bash
npm run build && npm start
```

## Demo patient & credentials

Click **Try Demo** / **Load Demo Patient** on the landing page, login page or register page. This (re)creates the synthetic patient and signs you in.

| | |
|---|---|
| Demo login | `demo@materna.ai` / `demo1234` |
| Profile | "Ayesha Rahman (Demo)", 27, week 30, second pregnancy, previous pregnancy with raised BP |
| Data | 21 BP readings over 10 weeks (stable baseline → rising in the last 3 weeks), 11 weight readings, heart rate, glucose, temperature, 4 symptoms, 4 synthetic documents, 4 appointments, 3 reminders, 7 wellbeing check-ins, birth plan 3/10, 1 family member, emergency contact |

Every load of the demo patient **resets** its data to the canonical dataset (dates are generated relative to today, so it always looks current). Registered (non-demo) accounts are untouched.

## Summit demo flow (3–5 min)

1. Open `/` — landing page. Click **Try Demo**.
2. **Dashboard** — pregnancy week, next appointment, latest BP, BP trend chart, AI trend summary ("upward trend… consider discussing").
3. **Health Monitoring** — historical readings, charts, add/edit/delete/filter.
4. **AI Trend Detection** — observations by category; BP "Needs attention: increasing and repeatedly above the prototype band".
5. **Why am I seeing this?** — Baseline → Recent → Trend visual, evidence list, data used, confidence.
6. **Document Vault** — select "Antenatal visit summary & prescription" → **Extract information** (labelled DEMO extraction) → tick BP/weight → **Confirm & add to timeline**.
7. **Ask Your Doctor** — select BP observation → **Generate question** → edit → save.
8. **Care Coordination** — select a demo provider, date and slot → confirm; or schedule an offline antenatal visit.
9. **Danger Signs** — tick "Severe headache" → "Seek urgent medical care" panel with **Call 999**, emergency contact, facilities.
10. Return to **Dashboard** — Monitor → Understand → Act.

## Project structure

```
materna/
├─ prisma/schema.prisma            # database schema (SQLite default; Postgres-ready)
├─ .env.example                    # environment variables
├─ uploads/                        # uploaded documents (server-side, git-ignored)
├─ src/
│  ├─ middleware.ts                # protects app routes (JWT cookie check)
│  ├─ lib/
│  │  ├─ trend-engine.ts           # transparent longitudinal trend analysis (baseline/recent, moving avg, slope, repeats)
│  │  ├─ thresholds.ts             # configurable PROTOTYPE bands — Not for Clinical Use
│  │  ├─ ask-doctor.ts             # observation → doctor question generator
│  │  ├─ assistant.ts              # rule-based prototype assistant + optional Anthropic LLM mode
│  │  ├─ document-extraction.ts    # demo extraction, PDF text + pattern detection
│  │  ├─ demo-data.ts              # synthetic demo patient seeder
│  │  ├─ guide-data.ts             # week 1–40 guide content
│  │  ├─ static-data.ts            # demo facilities, providers, products, danger signs
│  │  ├─ wellbeing.ts              # gentle wellbeing pattern check
│  │  ├─ i18n.ts                   # English + Bangla dictionary
│  │  ├─ auth.ts, db.ts, api-helpers.ts, schemas.ts, pregnancy.ts, utils.ts, use-api.ts
│  ├─ components/                  # ui primitives, app shell, charts, timeline, observation card, providers
│  └─ app/
│     ├─ (public)/                 # landing, about, safety, privacy, pricing, sponsor, architecture
│     ├─ (auth)/                   # login, register
│     ├─ (app)/                    # protected: dashboard, profile, monitoring, trends, explain, documents,
│     │                            #   assistant, ask-doctor, care, emergency, danger-signs, guide, wellbeing,
│     │                            #   birth-plan, reminders, medicine, family, settings
│     └─ api/                      # route handlers (see API overview)
```

## Database schema

Prisma models (see `prisma/schema.prisma`): `User`, `PregnancyProfile`, `PregnancyHistory`, `HealthMeasurement`, `Symptom`, `AiObservation`, `MedicalDocument`, `ExtractedDocumentData`, `Appointment`, `Reminder`, `MentalWellbeing`, `EmergencyContact`, `MedicineOrder`, `FamilyMember`, `Notification`, `DoctorQuestion`, `BirthPlanItem`. All user-owned tables cascade-delete with the user. Facilities, providers and products are static demo directories in `src/lib/static-data.ts`.

**Switching to PostgreSQL / Supabase**

1. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` to your Postgres connection string (Supabase → Project Settings → Database → URI).
3. Run `npx prisma db push` (or `npx prisma migrate dev` for migrations).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite, or a Postgres URI |
| `SESSION_SECRET` | yes | Long random string used to sign session cookies |
| `ANTHROPIC_API_KEY` | no | Enables LLM-backed assistant. If empty, the rule-based prototype assistant is used and labelled as such |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-opus-5` |
| `UPLOAD_DIR` | no | Server directory for uploaded documents (default `./uploads`) |

No API keys are ever sent to the browser.

## API overview

All routes require the session cookie except `auth/*`. Inputs are validated with Zod; errors return `{ error }` with 4xx/5xx.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/register`, `/login`, `/logout`, `/demo` | POST | Auth; `demo` seeds + signs in the synthetic patient |
| `/api/me` | GET, PUT | User, profile, week, contacts, history; update profile |
| `/api/dashboard` | GET | Aggregated dashboard data |
| `/api/measurements`, `/api/measurements/[id]` | GET, POST / PUT, DELETE | Measurement CRUD, date/type filters |
| `/api/symptoms` | GET, POST, DELETE | Symptom log |
| `/api/trends` | GET | Runs trend engine, returns observations + engine metadata |
| `/api/documents`, `/[id]`, `/[id]/extract`, `/[id]/apply` | GET, POST, DELETE | Vault upload/list/stream/delete; extraction; confirm → timeline |
| `/api/questions` | GET, PUT (generate), POST, PATCH, DELETE | Ask Your Doctor |
| `/api/assistant` | GET, POST | Assistant mode + chat |
| `/api/appointments`, `/[id]` | GET, POST / PATCH, DELETE | Online (demo providers) + offline appointments |
| `/api/reminders`, `/[id]` | GET, POST / PATCH, DELETE | Medication/supplement reminders |
| `/api/wellbeing` | GET, POST, DELETE | Mental wellbeing check-ins + pattern |
| `/api/birth-plan` | GET, PATCH | Birth preparedness checklist |
| `/api/family` | GET, POST, PATCH, DELETE | Companion sharing |
| `/api/orders` | GET, POST | Demo e-medicine orders (no payment) |
| `/api/history` | POST, DELETE | Previous pregnancy history |
| `/api/notifications` | GET, PATCH | In-app notifications |

## Deployment

The reference deployment runs at https://materna-ai-silk.vercel.app (Vercel + Neon Postgres free tier). To deploy your own copy:

**Option A — Vercel + Postgres (recommended for a hosted demo)**

`vercel.json` points the build at `scripts/vercel-build.mjs`, which derives a PostgreSQL schema from `prisma/schema.prisma`, generates the client, pushes the schema to the database, and runs `next build`. Nothing in the repo has to change between local SQLite and hosted Postgres.

1. `vercel link` (or import the GitHub repo in the Vercel dashboard).
2. Add a Postgres database from the Vercel Marketplace (Neon, Prisma Postgres, or Supabase) and connect it to the project; it injects `DATABASE_URL`. Any external Postgres URI set as `DATABASE_URL` works too.
3. Set `SESSION_SECRET` (long random string) and `UPLOAD_DIR=/tmp/uploads`; optionally `ANTHROPIC_API_KEY`.
4. `vercel --prod`.

Note: Vercel's filesystem is ephemeral, so uploaded documents live in `/tmp` only for the life of a function instance; the database (measurements, extracted values, appointments, etc.) persists. For a persistent vault, use a VM/Railway/Render volume or add object storage (Supabase Storage / S3) — listed under future work.

**Option B — Single VM / Railway / Render (simplest full-feature hosting)**

```bash
git clone <repo> && cd materna
npm ci
cp .env.example .env && edit .env     # SQLite works fine here; uploads persist on disk
npx prisma db push
npm run build
npm start                              # serves on port 3000 (put behind nginx/Caddy for HTTPS)
```

**Option C — Docker**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD npx prisma db push && npm start
```

## Implemented MVP features

- Landing, About, Safety & Disclaimer, Privacy, Free vs Premium, Sponsor a Mother (concept), AI Architecture pages
- Registration, login, logout, protected routes, **Load Demo Patient**
- **Dashboard**: week, next appointment, latest BP/weight, BP trend chart, AI trend summary, reminders, guide, vault count, emergency access, notifications
- **Pregnancy Profile**: current week, EDD, week 1–40 timeline with current week highlighted, history CRUD, health info, emergency contact, upcoming appointments and reminders, profile editing
- **Health Monitoring**: BP, heart rate, weight, temperature, glucose; add/edit/delete; type and date filters; interactive charts with prototype bands; symptom log
- **Longitudinal Trend Detection**: baseline vs recent, 3-point moving average, weekly rate of change, repeated readings in bands, deterministic escalation; categories Stable / Increasing / Decreasing / Needs attention / Urgent attention
- **Explainable AI ("Why am I seeing this?")**: observation, Baseline → Recent → Trend visual, evidence, calculation explanation, confidence, what you can do, data used
- **Medical Document Vault**: upload (PDF/PNG/JPG/WEBP/TXT), metadata, preview, extraction (demo mapping for synthetic docs; real PDF text + conservative pattern matching for uploads; explicit "OCR unavailable" state), **review → confirm → add to timeline**
- **AI Health Assistant**: context-aware (week, readings, observations, documents, appointments, reminders), persistent disclaimer, emergency routing; rule-based prototype by default, LLM mode when a key is configured
- **Ask Your Doctor**: generate an editable question from any observation; save; mark asked/answered
- **Care Coordination**: demo online consultation booking (provider → date → slot → confirm, with clash and slot validation); offline antenatal/test/vaccination/follow-up scheduling; complete/cancel
- **Emergency & Nearby Care**: 999 call action, emergency contact call, searchable demo facility directory, emergency guidance
- **Danger Signs**: checklist → "Seek urgent medical care" panel with 999, emergency contact and facilities
- **Week-by-Week Guide** (1–40): baby, body, care, appointments, mental wellbeing, birth prep; current week highlighted
- **Mental Wellbeing**: mood/stress/sleep check-ins, trend chart, gentle non-diagnostic pattern message
- **Birth Preparedness**: 10-item checklist with progress
- **Reminders**: CRUD, pause/activate, prescription-linked labels
- **E-Medicine**: demo marketplace with search, categories, details, cart, demo checkout (prescription-required items gated)
- **Family Sharing**: companions with per-item sharing toggles; health data off by default; shared-view preview
- **Settings**: profile, language (EN/BN toggle for navigation and major UI), notifications, privacy, emergency contact, sharing, subscription, logout
- Loading, error, empty and success states throughout; responsive mobile-first layout with bottom nav; keyboard-accessible controls and ARIA labels

## Simulated / demo features

Clearly labelled in the UI: demo patient (synthetic), demo providers (fictional), demo facility directory (fictional), demo marketplace and demo checkout (no payment), demo extraction for synthetic documents, prototype assistant, Premium tier (planned; no billing), Sponsor a Mother (concept; no donations collected), in-app-only notifications, family sharing preview (no invitations sent).

## Future production features

Clinical validation of trend logic and thresholds; real provider, pharmacy and lab integrations; real OCR for scanned documents; EHR interoperability; push/SMS notifications; object storage for documents; companion invitations; production-grade security review, data-protection assessment and formal regulatory/compliance review; Bangla translation of medical content after professional review.

## Safety, privacy and AI design

- Every observation contains: observation, evidence, trend, explanation, suggested next action, data used, confidence/uncertainty. No accuracy figures are claimed.
- Thresholds live in `src/lib/thresholds.ts`, labelled *Prototype/Demo Logic — Not for Clinical Use*, so they can be reviewed and mapped to clinical guidance before real-world use.
- The assistant never diagnoses, prescribes, or advises stopping medication; emergency phrasing routes to urgent care and 999.
- Passwords hashed (bcrypt), signed HttpOnly cookies, middleware-protected routes, server-side Zod validation, per-user ownership checks on every record, uploads restricted by type and size, no secrets in the client bundle.
- Synthetic demo data only; see `/privacy`.

## Licence

MIT — see [LICENSE](LICENSE). A medical notice accompanies it in [NOTICE.md](NOTICE.md).
