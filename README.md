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

| Variable                  | Description                                     | Required in container          |
| ------------------------- | ----------------------------------------------- | ------------------------------ |
| `VITE_API_BASE_URL`       | Base URL of the health-monitor-backend REST API | yes                            |
| `VITE_KEYCLOAK_URL`       | Keycloak server URL                             | yes                            |
| `VITE_KEYCLOAK_REALM`     | Keycloak realm name                             | no (`health-monitor`)          |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID                              | no (`health-monitor-frontend`) |

For the dev server the values come from `.env`. The production container reads
them at **runtime** (container start), so one published image works for any
environment — see [Runtime configuration](#runtime-configuration).

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
# Build (multi-stage: Node build → unprivileged nginx runtime)
podman build -t health-monitor-frontend -f Containerfile .

# Run — nginx serves the SPA on port 8080 (non-root), config comes from env vars
podman run --rm -p 8081:8080 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  -e VITE_KEYCLOAK_URL=http://localhost:8080 \
  health-monitor-frontend
```

### Runtime configuration

The image is **runtime-configurable**: no URLs are baked in at build time.
On every container start, an entrypoint script (`40-runtime-config.sh`, run via
the nginx image's `/docker-entrypoint.d` mechanism) renders
`/usr/share/nginx/html/config.json` from the `VITE_*` environment variables,
and the app fetches `/config.json` before initialising Keycloak. The container
fails fast at startup if `VITE_API_BASE_URL` or `VITE_KEYCLOAK_URL` is missing.

This means a Helm chart (or any Kubernetes manifest) configures the app with
plain `env` values on the Deployment:

```yaml
containers:
  - name: health-monitor-frontend
    image: pfeiffermax/health-monitor-frontend:latest
    ports:
      - containerPort: 8080
    env:
      - name: VITE_API_BASE_URL
        value: https://api.example.com
      - name: VITE_KEYCLOAK_URL
        value: https://auth.example.com
    livenessProbe:
      httpGet: { path: /healthz, port: 8080 }
    readinessProbe:
      httpGet: { path: /healthz, port: 8080 }
```

Kubernetes notes:

- The image is based on `nginxinc/nginx-unprivileged` — it runs as user
  `nginx` (uid 101) and listens on **8080**, so it works under the restricted
  Pod Security Standard (`runAsNonRoot`).
- nginx serves a probe endpoint at **`/healthz`** (returns `200 ok`, access
  log disabled).
- `config.json` is served with `Cache-Control: no-store` and is excluded from
  the service-worker precache, so configuration changes take effect on the
  next page load without cache-busting.
- `readOnlyRootFilesystem: true` is not supported out of the box: the
  entrypoint writes `/usr/share/nginx/html/config.json` at startup (and nginx
  needs writable cache/pid paths). If you need a read-only root filesystem,
  adapt the image to render `config.json` into a writable `emptyDir` mount
  exposed via an nginx `alias`.

### Multi-architecture build

The published image supports `linux/amd64` and `linux/arm64`. Podman builds
both architectures into a single manifest list. Building the non-native
architecture requires QEMU binfmt emulation, registered once per host:

```bash
# Register QEMU handlers (host-wide, persists until reboot)
podman run --rm --privileged docker.io/tonistiigi/binfmt --install arm64

# Build both architectures into one manifest list
podman build \
  --platform linux/amd64,linux/arm64 \
  --manifest health-monitor-frontend:local \
  -f Containerfile \
  .

# Inspect the manifest / run a specific architecture
podman manifest inspect health-monitor-frontend:local
podman run --rm --arch arm64 -p 8081:8080 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  -e VITE_KEYCLOAK_URL=http://localhost:8080 \
  health-monitor-frontend:local
```

The Release workflow builds the same manifest list and pushes it to Docker Hub,
so a single image tag serves both architectures. The published image is
available on Docker Hub:
[`pfeiffermax/health-monitor-frontend`](https://hub.docker.com/r/pfeiffermax/health-monitor-frontend).

> Note: environment variables are read at **runtime** (container start), not
> at build time — the same image works for any environment. See
> [Runtime configuration](#runtime-configuration).

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
