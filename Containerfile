FROM node:24-alpine AS build
WORKDIR /app

# Activate corepack — uses packageManager field in package.json for pnpm version
RUN corepack enable

# Install dependencies (layer cached until lockfile or workspace config changes)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN HUSKY=0 pnpm install --frozen-lockfile

# Build application
COPY . .
RUN pnpm run build

# Unprivileged nginx: runs as user nginx (uid 101) and listens on 8080,
# compatible with restricted Kubernetes Pod Security Standards
FROM docker.io/nginxinc/nginx-unprivileged:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime config: 40-runtime-config.sh renders /config.json from container
# environment variables on every start via the image's /docker-entrypoint.d
# mechanism. Only config.json is writable by the nginx user — the rest of the
# document root stays read-only.
COPY config.json.template /etc/health-monitor/config.json.template
COPY --chmod=755 40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
USER root
RUN touch /usr/share/nginx/html/config.json \
    && chown nginx:nginx /usr/share/nginx/html/config.json
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
