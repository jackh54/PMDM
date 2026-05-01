#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${1:-data/mdm.db}"
BACKUP_DIR="${2:-backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
cp "$DB_PATH" "$BACKUP_DIR/mdm-${STAMP}.db"

echo "Backup created at $BACKUP_DIR/mdm-${STAMP}.db"
