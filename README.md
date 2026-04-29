# TaskHero 🦸

> Gamified family productivity app — parents create missions, kids complete them and level up their hero & creature.

---

## 🏗️ Tech Stack

| Layer | Technology | What it does |
|---|---|---|
| **Mobile Framework** | React Native + Expo (SDK 51) | Cross-platform iOS/Android app. Expo gives fast dev builds, OTA updates, and easy device API access (camera, notifications, secure storage) without needing Xcode for every change. |
| **Mobile Routing** | Expo Router (file-based) | Pages are created by adding files to `mobile/app/`. Route groups `(auth)`, `(child)`, `(parent)` share layouts and tab bars — like Next.js but for mobile. |
| **Language** | TypeScript (everywhere) | Strict typing across mobile, backend, and shared packages. Catches bugs at compile time and makes refactoring safe. |
| **State Management** | Zustand + expo-secure-store | Zustand is a tiny global store (no Redux boilerplate). Auth tokens and user data are persisted securely on-device via `expo-secure-store` (iOS Keychain / Android Keystore). |
| **API Client** | Axios with JWT interceptors | All HTTP calls go through a central Axios instance. Automatically attaches the access token, and if a 401 occurs it silently refreshes the token and retries — users never get logged out unexpectedly. |
| **Backend Framework** | NestJS (Node.js) | Structured, opinionated Node framework using decorators and modules. Each feature (auth, missions, rewards…) lives in its own module with controller → service → database layers. |
| **ORM** | Prisma | Type-safe database access. Schema defined in `backend/prisma/schema.prisma`, Prisma generates a fully-typed client. Migrations tracked as SQL files. |
| **Database** | PostgreSQL (via Docker) | Relational database storing all app data: users, families, missions, rewards, hero stats, etc. Runs in Docker — no local install needed. |
| **Cache / Sessions** | Redis (via Docker) | Used for refresh token storage and fast session lookups. Runs alongside Postgres in Docker Compose. |
| **Authentication** | JWT (access + refresh tokens) | Parents log in with email/password and receive a short-lived access token + long-lived refresh token. Children use a simpler family code + 4-digit PIN flow (no email required). |
| **Shared Types** | `packages/shared-types` (monorepo) | TypeScript interfaces and enums (User, Mission, Reward, Hero…) shared between mobile and backend so both sides always agree on data shapes. |
| **Infrastructure** | Docker Compose | One command spins up both Postgres and Redis locally — no manual DB installation needed. |

---

## 🚀 Running the App

### 1. Start infrastructure (Postgres + Redis)
```bash
docker compose up -d postgres redis
```

### 2. Start backend (NestJS on port 3000)
```bash
cd backend
npm run dev
```

### 3. Seed demo data (first time only)
```bash
cd backend
npm run seed
```

### 4. Start mobile (Expo)
```bash
cd mobile
npx expo start -c
```
Scan the QR code with the **Expo Go** app on your iPhone. Make sure your phone and Mac are on the **same Wi-Fi / hotspot**.

---

## 📱 Networking (Physical iPhone)

If you get a "Network error" on device, update the IP in:

- `mobile/.env` → `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/api/v1`
- `mobile/src/api/client.ts` → fallback URL in the `baseURL` field

Find your local IP: **System Settings → Wi-Fi → Details → IP Address**

The backend listens on `0.0.0.0` (all interfaces) so any device on the same network can reach it.

---

## 🔑 Demo Credentials

| Role | Login | Credential |
|---|---|---|
| Parent | `demo@taskhero.app` | Password: `Demo123!` |
| Child — Alex | Family Code: `DEMO2024` | PIN: `1234` |
| Child — Emma | Family Code: `DEMO2024` | PIN: `5678` |

---

## ✅ What's Been Built

### Authentication
- Parent email/password login with JWT access + refresh tokens
- Child PIN login (family code + 4-digit PIN)
- Family registration screen
- Back navigation buttons on all auth screens

### Parent App
- **Dashboard** — family overview, quick actions, children's XP/level at a glance
- **Mission Creator** — title, category, priority (low/medium/high/urgent), time limit, XP + coin rewards, assign to specific child
- **Rewards Management** — create physical rewards (cinema ticket, pizza night…) with coin costs, manage claimed rewards
- **Approvals** — review and approve child mission completions
- **Children** — view all children in the family
- **Settings** — family settings

### Child App
- **Dashboard** — hero card with XP progress bar, level, coins, active missions preview
- **Missions** — browse with priority color coding, tap to see details + start countdown timer, submit completion
- **Creature Nurturing** — animated creature that evolves through 5 stages as the child earns XP. Care actions: sleep (Zzz bubbles), play (jumping + rotation), feed (mouth opens), train (sweat drops), bathe (water splash), pet (heart reaction). Food tab, style/color tab, milestones. All graphics drawn with pure React Native View shapes — no images needed.
- **Hero Avatar Builder** — customize: skin tone, 6 hair style geometries, hair color, facial expression, outfit (warrior/mage/archer/rogue), accessories (crown/glasses/cape). Character drawn entirely with pure React Native Views + idle floating animation.
- **Rewards** — browse available rewards, claim with earned coins, view claimed history

### Design & Polish
- Purple gradient hero section on login with transparent PNG logo floating directly on gradient
- Global button component with text truncation prevention
- Dark arena-style creature/avatar preview areas with particle animations
- Gradient headers throughout (purple for parent, amber→red for child)

---

## 📁 Project Structure

```
TaskHero/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, missions, rewards, children…)
│   │   ├── common/           # Shared decorators, filters, utils
│   │   └── main.ts           # Entry point — listens on 0.0.0.0:3000
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       ├── migrations/       # SQL migration history
│       └── seed/             # Demo data seeders
├── mobile/                   # Expo React Native app
│   ├── app/
│   │   ├── (auth)/           # Login, register, child-login
│   │   ├── (child)/          # Child tabs: dashboard, missions, creature, avatar, rewards
│   │   └── (parent)/         # Parent tabs: dashboard, missions, rewards, approvals…
│   ├── src/
│   │   ├── api/              # Axios client + API call functions
│   │   ├── components/       # Shared UI: Button, Card, Input, Gradient, Logo
│   │   ├── stores/           # Zustand auth store
│   │   └── theme/            # Colors, gradients, spacing
│   └── assets/               # App icon, splash, logo PNG
├── packages/
│   └── shared-types/         # TypeScript types shared between mobile + backend
└── docker-compose.yml        # Postgres + Redis containers
```
