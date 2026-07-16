#!/bin/sh
# Renders the runtime config served at /config.json from container environment
# variables. Executed by the nginx image's /docker-entrypoint.d mechanism on
# every container start, which makes the image runtime-configurable
# (e.g. via env vars set in a Helm chart) instead of baking URLs in at build time.
set -eu

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL must be set}"
: "${VITE_KEYCLOAK_URL:?VITE_KEYCLOAK_URL must be set}"
: "${VITE_KEYCLOAK_REALM:=health-monitor}"
: "${VITE_KEYCLOAK_CLIENT_ID:=health-monitor-frontend}"
export VITE_KEYCLOAK_REALM VITE_KEYCLOAK_CLIENT_ID

envsubst '${VITE_API_BASE_URL} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_REALM} ${VITE_KEYCLOAK_CLIENT_ID}' \
  < /etc/health-monitor/config.json.template \
  > /usr/share/nginx/html/config.json

echo "40-runtime-config.sh: rendered /usr/share/nginx/html/config.json"
