FROM node:24-alpine AS build
WORKDIR /app

# Activate corepack — uses packageManager field in package.json for pnpm version
RUN corepack enable

# Install dependencies (layer cached until lockfile or workspace config changes)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
COPY . .
RUN pnpm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
