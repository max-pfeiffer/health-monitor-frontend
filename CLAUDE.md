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
  - https://github.com/max-pfeiffer/health-monitor-backend/blob/main/api_docs/health-monitor-backend_0.6.1_api_v1.yaml
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

- unit tests coverage:
  - Pinia stores and composables
- e2e tests coverage:
  - main metric CRUD flows
- e2e test login flow setup: mock/stub the auth layer in tests

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
