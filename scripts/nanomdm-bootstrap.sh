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
  exit 1
fi

echo "Uploading APNS push certificate to NanoMDM..."
RESPONSE="$(
  cat "$APNS_CERT" "$APNS_KEY" | curl -fsS -T - -u "nanomdm:${API_KEY}" "${NANOMDM_URL}/v1/pushcert"
)"
echo "$RESPONSE"

echo
echo "NanoMDM health:"
curl -fsS "${NANOMDM_URL}/v1/health" || true
echo
echo "Done. Restart backend to regenerate enrollment.mobileconfig if DOMAIN/APNS_TOPIC changed:"
echo "  docker compose restart backend"
