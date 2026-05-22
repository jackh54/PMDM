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

## Device enrollment (macOS)

Installing the enrollment profile does **not** wipe your Mac. Enrollment only registers the device with MDM. A remote wipe happens only if an admin explicitly sends a wipe command **and** `ALLOW_DEVICE_WIPE=true` in `.env` (default is `false`).

After SCEP CA init and APNS cert placement:

```bash
docker compose run --rm scep ca -init   # once, if depot is empty
chmod +x scripts/nanomdm-bootstrap.sh
./scripts/nanomdm-bootstrap.sh            # uploads push cert to NanoMDM
docker compose restart backend          # regenerates enrollment.mobileconfig
```

On the Mac, open `https://<DOMAIN>/enrollment.mobileconfig` (or Settings → Profiles).

### Host Nginx (VPS without compose nginx)

Proxy paths must preserve NanoMDM’s `/mdm` endpoint (do **not** strip the prefix):

```nginx
location /scep {
    proxy_pass http://127.0.0.1:2016;
}
location /mdm {
    proxy_pass http://127.0.0.1:9000/mdm;
}
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
}
location = /enrollment.mobileconfig {
    proxy_pass http://127.0.0.1:3001/api/enrollment/mobileconfig;
}
```

## MDM control (profiles, commands, inventory)

PMDM pushes policies to enrolled Macs using Apple MDM commands via NanoMDM.

**After deploy, configure:**

1. `NANOMDM_WEBHOOK_URL=https://<DOMAIN>/api/webhook` in `.env` (so devices appear in the dashboard).
2. `./scripts/nanomdm-bootstrap.sh` (upload APNS cert).
3. `docker compose up -d --build` (runs DB migration `005_mdm_control.sql`).

**In the dashboard:**

- **Profiles** — create restrictions/Chrome/Wi‑Fi/etc. with real toggles, then assign to a device UDID or group.
- **Device detail** — lock/restart/wipe, sync inventory, list profiles, push/remove profiles, send custom `RequestType` commands.
- **Groups** — assign devices; group profiles auto-push on add.

**Custom MDM commands** (`POST /api/commands/custom`) accept any Apple `RequestType` for advanced control (Settings, remote desktop, etc.).

Jamf-level features not built yet: app deployment/VPP, OS update scheduling UI, declarative management (DDM), full policy blueprints. Use **custom commands** + **custom profile payloads** (base64 plist) for anything else today.

### `InternalError:1` during profile install

Common causes:

1. Wrong MDM URLs in the profile (`ServerURL` must be `https://<DOMAIN>/mdm`, not `/mdm/server`).
2. NanoMDM missing SCEP CA (`-ca /scep-ca/ca.pem`) or APNS push cert not uploaded (`./scripts/nanomdm-bootstrap.sh`).
3. Nginx rewriting `/mdm` to `/` (breaks check-in).
4. SCEP depot permissions or missing `ca.pem` (`chown 10001:10001 scep/depot` after `ca -init`).

## Platform support

- Implemented now: `macos`
- Prepared for future: `windows` provider stubs and platform capability checks
