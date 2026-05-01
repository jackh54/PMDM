CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  payload BLOB NOT NULL,
  payload_type TEXT NOT NULL DEFAULT 'macos',
  min_os_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_profiles (
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  installed_at TEXT,
  PRIMARY KEY (device_id, profile_id)
);

CREATE TABLE IF NOT EXISTS group_profiles (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, profile_id)
);
