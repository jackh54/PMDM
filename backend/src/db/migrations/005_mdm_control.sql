ALTER TABLE profiles ADD COLUMN profile_type TEXT;
ALTER TABLE profiles ADD COLUMN payload_identifier TEXT;
ALTER TABLE profiles ADD COLUMN values_json TEXT;

ALTER TABLE device_profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE device_profiles ADD COLUMN command_uuid TEXT;

ALTER TABLE commands ADD COLUMN ref_profile_id INTEGER;

CREATE TABLE IF NOT EXISTS device_inventory (
  device_id TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
