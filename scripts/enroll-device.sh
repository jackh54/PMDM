#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

DOMAIN="$1"
PROFILE_URL="https://${DOMAIN}/enrollment.mobileconfig"

echo "Open this URL on the target Mac:"
echo "$PROFILE_URL"
echo
echo "Or run on target Mac:"
echo "profiles install -type configuration -path /path/to/enrollment.mobileconfig"
