# PMDM

Self-hosted macOS-first MDM platform (macOS 10.13+) with NanoMDM, SCEP, Node.js API, React dashboard, and Docker Compose deployment.

## Quick start

1. Copy `.env.example` to `.env` and set secure secrets.
2. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
3. Start stack: `docker compose up -d --build`
4. Login with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## Backups

- SQLite backup: `./scripts/backup-db.sh data/mdm.db backups`
- Keep offsite encrypted backups of:
  - `data/mdm.db`
  - `nanomdm/db`
  - `scep/depot`
  - APNS and profile signing certificates

## Restore

1. Stop services: `docker compose down`
2. Restore `data/mdm.db` and certificate directories.
3. Start services: `docker compose up -d`

## Platform support

- Implemented now: `macos`
- Prepared for future: `windows` provider stubs and platform capability checks
