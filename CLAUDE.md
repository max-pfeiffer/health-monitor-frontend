# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A progressive web application PWA.
It provides a user facing frontend for the health-monitor-backend application.

### Purpose

This application provides a user facing frontend for the health-monitor-backend application.
The user has to log in first using Keycloak identity provider.
With this application the user should capture and store the following health metrics:

- blood pressure
- blood glucose
- blood ketones

The user can list the stored metrics and edit them.
The user can set all parameters for watching diagrams for each metric.
The user can upload files with metric data in JSON format.

### Key Consumers

Logged-in users can use this frontend application.

### Deployment Environment

The application is running in a Container on Kubernetes.
The Kubernetes cluster is build with Talos Linux.
No cloud provider is used.
The application will run 24/7.
No Kubernetes manifest are included in this project.

### Expected Integrations

- REST API of health-monitor-backend applications
- Keycloak as identity provider

### Git Repository

- The git repository for this project is hosted on GitHub: https://github.com/max-pfeiffer/health-monitor-frontend
- The default branch is main. This branch is protected.
- Features need to be created on branches with feature/\* pattern
- Bug fixes need to be created on branches with bugfix/\* pattern

#### GitHub Workflows

- For git commit messages conventional commits specification is used: https://www.conventionalcommits.org/en/v1.0.0/#specification
- Local pre-commit hooks managed with Husky + lint-staged run on every commit.
- GitHub Actions CI checks (linting, unit tests) run on every pull request.
- A new release on GitHub is created when the main branch is tagged with a semantic version
- Release notes are generated automatically
- When a new release is created using by tagging the main branch, the container image is build and pushed to Docker Hub
- The image is then tagged with the release tag version and also with latest tag
- In GitHub Actions environment variable DOCKER_HUB_USERNAME is used as Docker Hub username
- In GitHub Actions environment variable DOCKER_HUB_TOKEN is used as Docker Hub password

## Architecture

### PWA

- Service worker strategy: offline
  - app shell
  - metric lists
- Web App Manifest:
  - App name: Health Monitor
  - icons: please generate icon which relate to project description, 192×192 and 512×512 PNG
  - theme color: #1976D2
  - display: standalone
- HTTPS requirement: Service workers require HTTPS

#### PWA Offline Strategy

**Precache (app shell — CacheFirst, versioned):**

- All Vite build output: JS bundles, CSS, icons, Web App Manifest
- App skeleton HTML (`index.html`)

**Runtime cache (Workbox strategies):**
| URL pattern | Strategy | TTL | Purpose |
|---|---|---|---|
| `/api/**` | NetworkFirst | 24h | Metric lists (blood pressure, glucose, ketones) |
| `/api/**/chart` | NetworkFirst | 1h | SVG diagrams from backend |
| Keycloak endpoints | NetworkOnly | — | Auth must never be served stale |

**Offline behavior:**

- App shell loads from precache — user sees the UI immediately
- Metric lists fall back to last cached response when offline
- Diagrams fall back to last cached SVG when offline
- Offline writes are not supported — show an error toast if a network request for a mutation fails
- Keycloak auth fails gracefully offline — show a "you are offline, please reconnect" message

**Not cached:**

- Keycloak auth redirects and token endpoints (NetworkOnly)
- Any `POST`/`PUT`/`DELETE` requests (mutations are never cached)

## Backend API

- OpenAPI specs:
  - https://github.com/max-pfeiffer/health-monitor-backend/blob/main/api_docs/health-monitor-backend_0.5.0_api_v1.yaml
  - main branch

### Vuetify theme

- Theme: system preference

### Diagrams

- Diagrams are provided by the REST API of backend application
- Diagram format is SVG

### Authentication

- OAuth2/OIDC with Keycloak
- Flow: Authorization Code flow with PKCE
- Keycloak token refresh: handle silent token refresh automatically
- Keycloak init timing: initialize Keycloak and await authentication before mounting the Vue app
- Token injection: attach Bearer token via ofetch onRequest hook

### Container Image

- DockerHub image: pfeiffermax/health-monitor-frontend
- The container image is build with Podman
- Building and running the container is tested
- Use multiple stages in the Containerfile to optimize image size
- The image is published on DockerHub: https://hub.docker.com/
- nginx: add try_files $uri $uri/ /index.html for Vue Router to work in history mode

### Tests

#### Unit tests

Coverage:

- Pinia stores and composables

#### E2E tests

Coverage:

- main metric CRUD flows
- e2e test login flow setup: mock/stub the auth layer in tests

#### Local manual testing

- Podman compose is used for local manual testing
- Configuration: compose.yaml (starts Keycloak, PostgreSQL, runs migrations for health-monitor-backend app,
  starts the health-monitor-backend app on port 8000, starts the health-monitor-frontend app)
- Keycloak is preloaded from `compose/keycloak/realm.json` with realm `health-monitor`, client `health-monitor-frontend`

## Stack

- Language: TypeScript (strict mode)
- Node version: 24
- Deployment target: Kubernetes
- Package manager: pnpm
- Framework: Vue 3
- Build tool: Vite
- Router: Vue Router 4
- State management: Pinia
- CSS/component library: Vuetify
- HTTP client: TanStack Query + ofetch
- PWA plugin: vite-plugin-pwa
- Linting: ESLint + Prettier
- Pre-commit hook tooling: Husky + lint-staged
- Unit tests: Vitest
- E2E tests: Playwright
- Container: Podman
- Authentication: keycloak-js
- REST API health-monitor-backend application: https://github.com/max-pfeiffer/health-monitor-backend
- REST API health-monitor-backend container: https://hub.docker.com/r/pfeiffermax/health-monitor-backend
- Web server: nginx
- API caching strategy: NetworkFirst (via Workbox runtime caching)
- Router mode: history mode (createWebHistory)

## Environment Variables

- VITE_API_BASE_URL — base URL of the health-monitor-backend REST API
- VITE_KEYCLOAK_URL — Keycloak server URL
- VITE_KEYCLOAK_REALM — Keycloak realm name
- VITE_KEYCLOAK_CLIENT_ID — Keycloak client ID

## Development Conventions

### Branching

- `main` is protected — never commit directly.
- Feature work: `feature/<short-kebab-name>`
- Bug fixes: `bugfix/<short-kebab-name>`
- Open a pull request against `main`; CI (lint + unit tests) must pass before merge.

### Commit messages

- Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
- Common types used in this repo: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`.
- Use a scope when it clarifies the area touched, e.g. `feat(glucose): …`, `fix(pwa): …`.
- Subject line in imperative mood, no trailing period, ≤ 72 chars.

### Code style

- TypeScript **strict mode** — no `any` unless justified with a comment; prefer `unknown` + narrowing.
- ESLint + Prettier are the source of truth for style. Do not hand-format; run `pnpm run lint` / `pnpm run format`.
- Vue Single-File Components use `<script setup lang="ts">` with the Composition API. No Options API.
- Prefer composables (`src/composables/`) over mixins or ad-hoc helpers for shared reactive logic.
- Pinia stores live in `src/stores/`, one store per domain concept; expose state via `storeToRefs`.
- Routes are declared in `src/router/`; pages live in `src/pages/`.
- HTTP access goes through the shared `ofetch` client in `src/lib/` so Bearer-token injection is consistent.
- Server state (queries, mutations, cache invalidation) is owned by **TanStack Query** — do not duplicate it in Pinia.

### Pre-commit hooks

- Husky runs `lint-staged` on every commit:
  - `src/**/*.{vue,ts}` → `eslint --fix` then `prettier --write`
  - `*.{js,css,json,md}` → `prettier --write`
- Do **not** bypass hooks (`--no-verify`) — if a hook fails, fix the underlying issue.

### Testing conventions

- Unit tests (`*.spec.ts`) live next to the code they cover (or under `__tests__/`) and target Pinia stores and composables.
- E2E tests live in `e2e/` and cover the main metric CRUD flows; the auth layer is mocked/stubbed.
- New features should ship with at least one unit test for any new store/composable logic and an e2e test if a user-visible flow changes.
- Run `pnpm run test:unit` and `pnpm run test:e2e` locally before opening a PR.

### Dependency management

- Use **pnpm** exclusively — never commit a `package-lock.json` or `yarn.lock`.
- Native-build allowlists live in `pnpm-workspace.yaml` under `allowBuilds` (pnpm 11+), not in `package.json#pnpm`.
- Pin to the major version of each dependency in `package.json`; let pnpm resolve minors/patches via the lockfile.

### Environment & secrets

- Never commit a real `.env` — only `.env.example` with placeholder values.
- All client-exposed config must be prefixed `VITE_` (Vite only inlines those at build time).
- Do not hard-code backend or Keycloak URLs anywhere in `src/`.

### PR workflow

- Keep PRs focused: one feature or fix per PR.
- Update `CLAUDE.md` and/or `README.md` in the same PR if behaviour or developer workflow changes.
- Squash-merge into `main`; the squash commit message must itself follow Conventional Commits.
