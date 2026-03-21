# TaskHero 🦸‍♂️

> Gamified mission platform for families - Where real-life missions become epic adventures!

## Overview

TaskHero is a mobile-first gamification platform that transforms everyday tasks into exciting missions for children. Parents create missions, children complete them in real life, and earn XP, coins, and unlock rewards.

## Features

- 🎯 **Mission System** - Create, assign, and track missions
- 🏆 **Progression** - XP, levels, coins, and achievements
- 🎮 **Mini-Games** - Unlock games through mission completion
- 🎁 **Rewards** - Digital items and real-world reward tracking
- 👨‍👩‍👧‍👦 **Family-Centric** - Multi-child support with parent oversight
- 📚 **Educational Profiles** - Themed mission categories (Nature, Food, History, etc.)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo SDK 52 |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Auth | JWT + Refresh Tokens |

## Project Structure

```
taskhero/
├── backend/           # NestJS API server
├── mobile/            # React Native Expo app
├── packages/          # Shared packages
│   └── shared-types/  # TypeScript types/interfaces
├── docker/            # Docker configurations
└── plans/             # Architecture documentation
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd taskhero
npm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
npm run docker:up
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 5. Start Development

```bash
# Terminal 1: Start backend
npm run backend:dev

# Terminal 2: Start mobile app
npm run mobile:start
```

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run backend:dev` | Start backend in development mode |
| `npm run mobile:start` | Start Expo development server |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run all tests |

## Demo Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Parent | demo@taskhero.app | Demo123! |
| Child | - | Family Code: DEMO2024, PIN: 1234 |

## API Documentation

Once the backend is running, access Swagger docs at:
- http://localhost:3000/api/docs

## Architecture

See [plans/architecture.md](plans/architecture.md) for detailed architecture documentation.

## License

Proprietary - All rights reserved
