#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Docker containers ==="
docker compose ps

echo
echo "=== Local ports (expect listeners on 3000, 3001, 2016, 9000) ==="
for port in 3000 3001 2016 9000; do
  if curl -fsS --max-time 2 "http://127.0.0.1:${port}/" >/dev/null 2>&1 ||
    curl -fsS --max-time 2 "http://127.0.0.1:${port}/version" >/dev/null 2>&1 ||
    curl -fsS --max-time 2 "http://127.0.0.1:${port}/health" >/dev/null 2>&1 ||
    curl -fsS --max-time 2 "http://127.0.0.1:${port}/scep?operation=GetCACaps" >/dev/null 2>&1; then
    echo "  ${port}: reachable"
  else
    echo "  ${port}: NOT reachable"
  fi
done

echo
echo "=== NanoMDM ==="
curl -fsS "http://127.0.0.1:9000/version" 2>/dev/null && echo || echo "  failed (is nanomdm up?)"

echo
echo "=== Backend ==="
curl -fsS "http://127.0.0.1:3001/health" 2>/dev/null && echo || {
  echo "  failed — backend down or crash-looping"
  docker compose logs backend --tail 25 2>/dev/null || true
}

echo
echo "=== SCEP (GET, not HEAD) ==="
curl -fsS "http://127.0.0.1:2016/scep?operation=GetCACaps" 2>/dev/null | head -c 80 && echo || {
  echo "  failed — scep down or CA not initialized"
  docker compose logs scep --tail 15 2>/dev/null || true
}

echo
echo "=== MDM endpoint (400 on curl is normal without device cert) ==="
curl -sS -o /dev/null -w "  HTTP %{http_code}\n" -X GET "http://127.0.0.1:9000/mdm" || true

echo
echo "=== Public HTTPS (if host nginx configured) ==="
DOMAIN="${DOMAIN:-mdm.pandascript.dev}"
for path in "/api/enrollment/mobileconfig" "/scep?operation=GetCACaps" "/mdm"; do
  code=$(curl -ksS -o /dev/null -w "%{http_code}" "https://${DOMAIN}${path}" || echo "000")
  echo "  https://${DOMAIN}${path} → HTTP ${code}"
done
