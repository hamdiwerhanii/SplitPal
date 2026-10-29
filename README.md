# SplitPal

Shared expenses for friends, roommates and travel groups. SplitPal records who paid what and computes the **fewest payments** that settle everyone up.

| Part | Stack |
|---|---|
| `splitpal-app/` | React Native + Expo SDK 58 (Expo Router), NativeWind, Zustand, TanStack Query (offline cache), react-hook-form + Zod, i18next (EN / FR / AR with RTL), Expo Notifications |
| `backend/` | NestJS 11, Mongoose (MongoDB), JWT + rotating refresh tokens, email OTP (Nodemailer), Expo push, Swagger |

## Requirements

- Node.js 20.19+ (the Expo CLI prints an "unsupported Node" warning below 22.13, but bundling and `expo start` work)
- pnpm 10 (backend) and npm (app)
- MongoDB: the local service on `27017`, or `docker compose up -d` (Mongo on `27018` + Mailpit)

## Run it locally

```bash
# 1. Backend  (http://localhost:5000/api, Swagger at /docs)
cd backend
cp .env.example .env          # set the two secrets; leave MAIL_HOST empty to log OTP codes in the console
pnpm install
pnpm seed                     # optional demo: Tozeur Trip + Appartement Lac 2
pnpm start:dev

# 2. App
cd splitpal-app
cp .env.example .env          # EXPO_PUBLIC_BACKEND_URL=http://<your PC LAN IP>:5000 for a real phone
npm install
npx expo start                # press a (Android), w (web), or scan the QR code with Expo Go
```

Demo accounts after `pnpm seed`: `ahmed@`, `sarra@`, `hamdi@`, `mehdi@splitpal.test`. With `MAIL_HOST` empty the 6-digit code is printed in the backend console. With Mailpit (`docker compose up -d`, `MAIL_HOST=localhost`, `MAIL_PORT=1025`) open http://localhost:8025.

> Push notifications don't work in Expo Go on Android (SDK 53+). Use a development build (`eas build --profile development`) and set `EAS_PROJECT_ID`.

## Quality checks

```bash
cd backend      && pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
cd splitpal-app && npm run lint && npm run typecheck && npm test
```

`pnpm test:e2e` builds the API, starts it as a child process against a throwaway `splitpal-e2e-*` database, runs the HTTP tests with supertest, then drops the database.

## How it works

### Money is stored as integers
Every amount is an integer in minor units (`12500` = 12.500 TND, `1050` = 10.50 EUR), so `0.1 + 0.2` problems cannot happen. Equal splits give the leftover units to the first participants (`100.00 / 3 = 33.34 + 33.33 + 33.33`); percentage splits use basis points and the largest-remainder method.

### Settle up (greedy minimum payments)
`backend/src/balances/utils/settle-up.util.ts`
1. Net balance per person = paid − owed (+ payments sent − payments received).
2. Split into creditors (> 0) and debtors (< 0).
3. The biggest debtor pays the biggest creditor `min(debt, credit)`; whoever reaches 0 drops out.
4. Repeat until everyone is at 0. This takes at most n − 1 payments.

Tozeur example: Ahmed paid 600, Sarra 120, Hamdi 200, each owes 230 → Ahmed +370, Mehdi −230, Sarra −110, Hamdi −30 → **Mehdi → Ahmed 230, Sarra → Ahmed 110, Hamdi → Ahmed 30**.

### Offline mode
1. Adding an expense without a connection stores it in a persisted **outbox** with a `clientId` (UUID) and shows it as "⏳ Waiting to sync".
2. When the connection returns (or the app comes back to the foreground), the outbox is sent to `POST /api/sync`.
3. The server keeps a unique index on `(createdBy, clientId)`, so resending the same operation returns `duplicate` instead of creating a second expense. Rejected operations stay in the outbox and are shown with the error.
4. Groups, balances and activity are cached with TanStack Query's AsyncStorage persister, so they stay readable offline.

### Security
- Login by 6-digit email code: HMAC-hashed, single-use, expires in 10 min, max 5 attempts, 60 s resend cooldown, rate limited.
- Refresh tokens are opaque `<id>.<secret>` strings stored as SHA-256 hashes, rotated on every use; reusing an old token revokes the whole session family.
- Every `/groups/:groupId/...` route goes through `GroupMemberGuard`, which answers 404 to non-members so group ids can't be probed.

## Project structure

```
backend/src
  auth/  user/  groups/  expenses/  balances/  activity/  sync/  notifications/  mail/
  config/  decorators/  utils/  app.module.ts  main.ts  seed.ts
splitpal-app/
  app/          Expo Router screens: (auth), (tabs)/groups|activity|settings, join/[code]
  api/          axios client with refresh queue + one file per resource
  components/   ui/ + one folder per domain
  constants/    theme, options (currencies, categories)
  features/     zod schemas and feature config
  hooks/        TanStack Query hooks, outbox sync, push, language
  i18n/         i18next setup + en/fr/ar
  stores/       Zustand stores (auth, settings, outbox)
  types/        one types file per domain
  utils/        helper.ts (all pure helpers)
  __tests__/    Vitest
```
