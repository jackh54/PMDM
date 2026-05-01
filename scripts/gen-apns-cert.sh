#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: $0 <p12-file-path>"
  exit 1
fi

P12_FILE="$1"
OUT_DIR="${2:-certs/apns}"
mkdir -p "$OUT_DIR"

openssl pkcs12 -in "$P12_FILE" -out "$OUT_DIR/apns.pem" -nodes -clcerts
openssl pkcs12 -in "$P12_FILE" -out "$OUT_DIR/apns.key" -nodes -nocerts

echo "APNS certificate and key exported to $OUT_DIR"
