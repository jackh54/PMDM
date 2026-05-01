CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  serial_number TEXT,
  model TEXT,
  os_version TEXT,
  enrolled_at TEXT,
  last_seen TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  name TEXT,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  platform_type TEXT NOT NULL DEFAULT 'macos',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_group_id ON devices(group_id);
CREATE INDEX IF NOT EXISTS idx_devices_platform_type ON devices(platform_type);
