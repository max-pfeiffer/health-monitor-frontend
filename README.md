# Health Monitor Frontend

A Progressive Web Application (PWA) that serves as the user-facing frontend for
[health-monitor-backend](https://github.com/max-pfeiffer/health-monitor-backend).
Users authenticate via Keycloak and capture, list, edit, and visualise health
metrics (blood pressure, blood glucose, blood ketones).

## Tech stack

Vue 3 + TypeScript (strict) · Vite · Vue Router · Pinia · Vuetify · TanStack
Query + ofetch · vite-plugin-pwa · keycloak-js. Tests: Vitest (unit) + Playwright
(e2e). Container: Podman + nginx.

## Prerequisites

- Node.js **24** (see `.nvmrc` / `engines` if present)
- **pnpm** (enable via `corepack enable && corepack prepare pnpm@latest --activate`)
- **Podman** (only required to build/run the container image)
- A running [health-monitor-backend](https://github.com/max-pfeiffer/health-monitor-backend)
  and a Keycloak instance for full local development

## Setup

```bash
# Install dependencies
pnpm install

# Copy the environment template and adjust values for your local backend + Keycloak
cp .env.example .env
```

Required environment variables (see `.env.example`):

| Variable                  | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `VITE_API_BASE_URL`       | Base URL of the health-monitor-backend REST API |
| `VITE_KEYCLOAK_URL`       | Keycloak server URL                             |
| `VITE_KEYCLOAK_REALM`     | Keycloak realm name                             |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID                              |

## Development server

```bash
pnpm run dev
```

Starts Vite on <http://localhost:5173> with hot module replacement. The dev
server expects the backend and Keycloak to be reachable at the URLs configured
in `.env`.

## Production build

```bash
pnpm run build      # type-check (vue-tsc) + Vite production build → dist/
pnpm run preview    # serve the built dist/ locally for smoke-testing
```

The build output in `dist/` is what the nginx container serves in production.

## Tests

```bash
pnpm run test:unit  # Vitest — Pinia stores, composables
pnpm run test:e2e   # Playwright — main metric CRUD flows (auth is mocked)
```

Playwright auto-starts the Vite dev server (see `playwright.config.ts`). The
first time you run e2e tests, install the browsers:

```bash
pnpm exec playwright install
```

## Linting & formatting

```bash
pnpm run lint     # ESLint --fix on the whole project
pnpm run format   # Prettier --write on src/
```

A Husky pre-commit hook runs `lint-staged`, which applies ESLint + Prettier to
staged files. Commit messages follow the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
specification.

## Container

Build and run the production container locally with Podman:

```bash
# Build (multi-stage: Node build → nginx runtime)
podman build -t health-monitor-frontend -f Containerfile \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  --build-arg VITE_KEYCLOAK_URL=http://localhost:8080 \
  --build-arg VITE_KEYCLOAK_REALM=health-monitor \
  --build-arg VITE_KEYCLOAK_CLIENT_ID=health-monitor-frontend \
  .

# Run — nginx serves the SPA on port 80
podman run --rm -p 8081:80 health-monitor-frontend
```

The published image is available on Docker Hub:
[`pfeiffermax/health-monitor-frontend`](https://hub.docker.com/r/pfeiffermax/health-monitor-frontend).

> Note: environment variables are inlined at **build time** by Vite. Pass them
> via `--build-arg` to `podman build`, or use the compose setup below which
> wires the build args automatically.

## Local manual testing (full stack)

The `compose.yaml` at the repo root brings up the full stack so a tester can
exercise the frontend end-to-end without touching the backend repo:

| Service                   | Host URL                | Purpose                                       |
| ------------------------- | ----------------------- | --------------------------------------------- |
| `health-monitor-frontend` | <http://localhost:8081> | This app (nginx serving the production build) |
| `health-monitor-backend`  | <http://localhost:8000> | REST API (image from Docker Hub)              |
| `keycloak`                | <http://localhost:8080> | Identity provider, realm preloaded            |
| `postgresql`              | (internal only)         | Database for the backend                      |

Test user (preloaded in the `health-monitor` realm):

- Username: `tester`
- Password: `tester`

Keycloak admin console: <http://localhost:8080> — login `admin` / `admin`.

### Bring the stack up

```bash
# Build the frontend image and start everything
podman compose up --build

# In another terminal, follow logs
podman compose logs -f
```

The order of startup is enforced via healthchecks: Postgres → Keycloak →
migrations → backend → frontend. First boot is slow because Keycloak imports
the realm and the backend image is pulled from Docker Hub.

Open <http://localhost:8081>, sign in as `tester`, and walk through the metric
flows.

### Tear down

```bash
podman compose down            # stop containers, keep data
podman compose down -v         # also wipe the Postgres volume
```

### Targeting compose services from `pnpm run dev`

You can also run the Vite dev server on the host (port 5173) against the
compose-managed backend + Keycloak — the realm whitelists
`http://localhost:5173/*` as a redirect URI. Start compose first, then in a
separate terminal:

```bash
podman compose up -d postgresql keycloak database-migrations health-monitor-backend
pnpm run dev
```

## Branching & releases

- Default branch: `main` (protected).
- Feature branches: `feature/*`
- Bug-fix branches: `bugfix/*`

Releases are automated with
[release-please](https://github.com/googleapis/release-please). The version in
`package.json`, the git tag, the GitHub Release, and `CHANGELOG.md` are all
derived from the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
landing on `main`.

### How to cut a release

1. Land Conventional Commits on `main` as usual (`feat:`, `fix:`, `feat!:` /
   `BREAKING CHANGE:` for a major bump, etc.).
2. The **Release** workflow runs on every push to `main` and maintains an open
   **Release PR** titled `chore(main): release <next-version>`. It bumps
   `package.json`, updates `.release-please-manifest.json`, and rewrites
   `CHANGELOG.md` from the new commits.
3. When you're ready to ship, **merge the Release PR**. release-please then:
   - creates the git tag (e.g. `0.2.0`, no `v` prefix),
   - publishes the GitHub Release with notes generated from the changelog,
   - and the same workflow run builds and pushes the container image to Docker
     Hub tagged with the version and `latest`.

The workflow can also be re-run manually from the Actions tab
(`workflow_dispatch`) if the Release PR ever needs to be refreshed.

### Overriding the next version

Add a `Release-As: x.y.z` footer to a commit on `main` to force release-please
to propose that exact version on the next run — useful for the initial `1.0.0`
cut or for skipping a bump level.
