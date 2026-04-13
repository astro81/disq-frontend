# Disq - Frontend

The frontend client for **Disq**, a developer-focused chat platform. Built with **SvelteKit** and **Bun**, it delivers a full Discord-like experience — real-time messaging, voice/video calls, community channels, and direct messages - backed by a robust set of modern cloud services.

---

## Project Objective

Disq is a developer-centric communication platform. The frontend connects to a dedicated WebSocket server for real-time messaging, uses Firebase Firestore for WebRTC signaling (voice/video calls), and integrates Better Auth for secure, OAuth-backed authentication.

---

## Features

- Real-time channel and direct messaging via WebSocket
- Voice and video calls using WebRTC + Firebase Firestore signaling
- OAuth authentication (GitHub, Google) via Better Auth
- Server and channel management
- File and attachment uploads via Cloudinary
- Invite link system for communities
- Server-side rendered routes with SvelteKit
- Drizzle ORM with Neon PostgreSQL for structured data access

---

## Technologies Used

**Runtime & Framework**
- Bun 1.x - JavaScript runtime and package manager
- SvelteKit 2.x - full-stack web framework
- Svelte 5.x - UI framework (Runes mode enabled)

**Database**
- Neon PostgreSQL - serverless PostgreSQL
- Drizzle ORM - type-safe ORM with schema-first migrations

**Authentication**
- Better Auth - session and OAuth authentication (GitHub, Google)

**Real-time**
- WebSocket server (Bun/Hono) - channel and DM messaging
- Firebase Firestore - WebRTC signaling for voice/video calls

**Storage**
- Cloudinary - cloud-based file and image storage

**UI**
- Tailwind CSS v4 - utility-first styling
- bits-ui - accessible component primitives
- Lucide Svelte - icon library
- GSAP - animations

---

## System Requirements

**Hardware**
- Any computer capable of running Bun or Docker
- Internet connection (required for Neon DB, Cloudinary, and Firebase)

**Software**
- Bun 1.x - https://bun.sh
- Docker + Docker Compose (for containerised setup)
- A Neon PostgreSQL database - https://neon.tech
- A Firebase project with Firestore enabled - https://firebase.google.com
- A Cloudinary account - https://cloudinary.com
- GitHub and/or Google OAuth app credentials

---

## Environment Variables

Create a `.env` file in the `disq/` directory:

```env
# Neon Database
DATABASE_URL=""

# API origin (backend URL)
# ORIGIN="http://localhost:5173"        # For running locally
ORIGIN="http://127.0.0.1:3001"          # For running with Docker

# Better Auth
BETTER_AUTH_SECRET=""

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Firebase (Firestore signaling)
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_MEASUREMENT_ID=""

# WebSocket + API server
VITE_WS_URL="ws://localhost:3000"
API_URL="http://localhost:3000"
```

---

## Installation and Setup

### 1. Set Up Neon Database

1. Create a [Neon](https://neon.tech) PostgreSQL database (v17+ recommended).
2. Copy the connection string into `DATABASE_URL`.
3. Run migrations:

```bash
bun run db:push
```

If the above fails, try:

```bash
bun run db:generate
bun run db:migrate
```

> Both the frontend and the WebSocket server share the same database. Run migrations from the frontend first.

---

### 2. Set Up Better Auth

1. Generate a secure random secret (32+ characters) and set it as `BETTER_AUTH_SECRET`.
2. Create a [GitHub OAuth App](https://github.com/settings/developers) and a [Google OAuth Client](https://console.cloud.google.com/) and fill in the respective credentials.
3. Generate the Better Auth schema:

```bash
bun run auth:schema
```

---

### 3. Set Up Firebase Firestore

1. Create a Firebase project and enable Firestore.
2. Copy the config values into the `VITE_FIREBASE_*` environment variables.
3. Set the following Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Video call signaling
    match /video-calls/{channelId}/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Voice call signaling
    match /voice-calls/{channelId}/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> The rules above use `if true` during development. **Replace with `if request.auth != null` before deploying to production.**

---

### 4. Set Up Cloudinary

1. Create a [Cloudinary](https://cloudinary.com) account.
2. Copy the cloud name, API key, and API secret into the corresponding environment variables.

---

### Run Locally (Docker) - Recommended

1. Clone the repository:

```bash
git clone git@github.com:astro81/disq-frontend.git
cd disq
```

2. Set up environment variables:

```bash
cp disq/.env.example disq/.env
# Fill in your values in disq/.env
```

3. Build and start the container:

```bash
docker compose up --build
```

| Service | URL               |
|---|-------------------|
| Frontend |  http://0.0.0.0:3001              |

> While running with docker some browsers such as "Brave" might block origin requests.
> So use Browsers with less strict polices such as "Firefox". 

---

### Run Locally (Without Docker)

1. Clone the repository:

```bash
git clone git@github.com:astro81/disq-frontend.git
cd disq-frontend/disq
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Fill in your values in .env
```

4. Run database migrations:

```bash
bun run db:migrate
```

5. Start the development server:

```bash
bun run dev
```

The app will be available at **http://localhost:5173**.

---

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build |
| `bun run check` | Type-check with svelte-check |
| `bun run lint` | Lint and format check |
| `bun run format` | Auto-format with Prettier |
| `bun run db:generate` | Generate Drizzle migration files from schema |
| `bun run db:migrate` | Apply pending migrations to the database |
| `bun run db:push` | Push schema directly (no migration files, dev only) |
| `bun run db:studio` | Open Drizzle Studio to browse data |
| `bun run auth:schema` | Regenerate Better Auth schema from config |
| `bun run test:unit` | Run unit tests with Vitest |
| `bun run test:e2e` | Run end-to-end tests with Playwright |

---

## Project Structure

```
disq/
├── Dockerfile                        # Two-stage Bun build (builder - runner)
├── drizzle.config.ts                 # Drizzle Kit configuration
├── svelte.config.js                  # SvelteKit adapter and compiler config
├── vite.config.ts
└── src/
    ├── hooks.server.ts               # SvelteKit server hooks (auth session)
    └── lib/
    │   ├── auth-client.ts            # Better Auth client setup
    │   ├── firebase.ts               # Firebase/Firestore client setup
    │   ├── assets/                   # Static assets
    │   ├── components/               # Shared UI components
    │   ├── constants/                # App-wide constants
    │   ├── hooks/                    # Svelte custom hooks
    │   ├── remote/                   # Remote function definitions (SvelteKit experimental)
    │   ├── server/                   # Server-only code (auth, db, cloudinary)
    │   ├── stores/                   # Svelte stores
    │   ├── types/                    # TypeScript types
    │   └── utils/                    # Utility functions
    └── routes/
        ├── api/                      # SvelteKit API routes
        ├── (auth)/                   # Auth pages (login, register)
        ├── (main)/                   # Main app routes (channels, DMs)
        ├── invite/                   # Invite link handler
        ├── +layout.server.ts
        ├── +layout.svelte
        └── +page.svelte
```

---

## Docker Details

The frontend uses a two-stage Docker build for a lean production image.

```
Stages
├── deps      — installs all dependencies via bun install
├── builder   — runs vite build to produce the static/server output
└── runner    — slim Bun image; serves the built app on port 3001

Services
└── app       — SvelteKit Node adapter server, port 3001

Networks
└── app-net   — bridge network (shared with socket server if co-deployed)
```

---

## Database Migrations

```bash
# Generate migration files from schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Push schema directly (development only, skips migration files)
bun run db:push

# Browse data visually
bun run db:studio
```

> Some browser may not have support for drizzle studio. In order to view data go to Neon console.

---

## Deployment

For production deployments it is recommended to:

1. Switch `svelte.config.js` to use `@sveltejs/adapter-netlify` (or your target platform's adapter) before building.
2. Run migrations as a dedicated CI/CD step before starting the server — do not rely on startup-time migration.
3. Supply all secrets via your platform's secret manager — never commit `.env`.
4. Set `ORIGIN` to your deployed frontend URL for correct CORS and auth behaviour.
5. Set `VITE_WS_URL` and `API_URL` to point to your deployed WebSocket server.
6. Harden Firestore security rules by replacing `if true` with `if request.auth != null`.

---

## Related

- **Socket Server** — the Bun/Hono WebSocket backend powering real-time messaging: [disq-backend](https://github.com/astro81/disq-backend)
- **Live App** — https://cozy-treacle-17c90f.netlify.app/

---

## Future Improvements

- Message threading and reactions
- Push notifications
- Richer code-snippet rendering and syntax highlighting in messages
- End-to-end encryption for direct messages
- Mobile-responsive layout improvements

---

## Authors

Binaya Shrestha  
BIT — IIC

---

## License

This project is created for educational purposes as part of a Final Year Project.