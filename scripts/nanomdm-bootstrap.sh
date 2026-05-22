#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

API_KEY="${NANOMDM_API_KEY:-}"
APNS_CERT="${APNS_CERT_PATH:-./certs/apns/apns.pem}"
APNS_KEY="${APNS_KEY_PATH:-./certs/apns/apns.key}"
NANOMDM_URL="${NANOMDM_URL:-http://127.0.0.1:9000}"

if [[ -z "$API_KEY" ]]; then
  echo "NANOMDM_API_KEY is required (set in .env)."
  exit 1
fi

if [[ ! -f "$APNS_CERT" || ! -f "$APNS_KEY" ]]; then
  echo "APNS cert/key not found at:"
  echo "  $APNS_CERT"
  echo "  $APNS_KEY"
  exit 1
fi

if [[ ! -f ./scep/depot/ca.pem ]]; then
  echo "SCEP CA missing. Initialize it first:"
  echo "  docker compose run --rm scep ca -init"
  echo "  docker compose restart nanomdm"
  exit 1
fi

wait_for_nanomdm() {
  local attempt=1
  local max_attempts=30
  while (( attempt <= max_attempts )); do
    if curl -fsS "${NANOMDM_URL}/version" >/dev/null 2>&1; then
      return 0
    fi
    if (( attempt == 1 )); then
      echo "NanoMDM not reachable at ${NANOMDM_URL}."
      echo "Container status:"
      docker compose ps nanomdm 2>/dev/null || true
      echo "Recent logs:"
      docker compose logs nanomdm --tail 20 2>/dev/null || true
      echo
      echo "If you just ran 'scep ca -init', restart NanoMDM so it can load ca.pem:"
      echo "  docker compose restart nanomdm"
      echo "Waiting for NanoMDM (up to ${max_attempts} attempts)..."
    fi
    sleep 2
    attempt=$((attempt + 1))
  done
  return 1
}

if ! wait_for_nanomdm; then
  echo "NanoMDM still not reachable. Fix the container, then re-run this script."
  echo "  docker compose up -d nanomdm"
  echo "  docker compose logs nanomdm"
  exit 1
fi

echo "Uploading APNS push certificate to NanoMDM..."
RESPONSE="$(
  cat "$APNS_CERT" "$APNS_KEY" | curl -fsS -T - -u "nanomdm:${API_KEY}" "${NANOMDM_URL}/v1/pushcert"
)"
echo "$RESPONSE"

echo
echo "NanoMDM version:"
curl -fsS "${NANOMDM_URL}/version" || true
echo
if [[ -f "$APNS_KEY" ]]; then
  chmod 644 "$APNS_CERT" "$APNS_KEY" 2>/dev/null || true
  if command -v chown >/dev/null 2>&1; then
    chown 1000:1000 "$APNS_CERT" "$APNS_KEY" 2>/dev/null || true
  fi
  echo "Adjusted APNS cert permissions for backend container (uid 1000)."
fi

echo "Done. Restart backend to regenerate enrollment.mobileconfig if DOMAIN/APNS_TOPIC changed:"
echo "  docker compose restart backend"
