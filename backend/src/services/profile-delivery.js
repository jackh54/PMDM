import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import {
  buildInstallProfileCommand,
  buildRemoveProfileCommand,
  newCommandUuid,
  parseMobileConfigIdentifier
} from "./mdm-commands.js";
import { enqueueAndPush } from "./nanomdm.js";

function getProfile(profileId) {
  return db.prepare("SELECT * FROM profiles WHERE id = ?").get(profileId);
}

function getDevice(deviceId) {
  return db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
}

function recordCommand({ commandUUID, deviceId, commandType, refProfileId = null }) {
  db.prepare(
    `INSERT INTO commands (uuid, device_id, type, status, ref_profile_id)
     VALUES (?, ?, ?, 'pending', ?)`
  ).run(commandUUID, deviceId, commandType, refProfileId);
}

export async function installProfileOnDevice(deviceId, profileId) {
  const device = getDevice(deviceId);
  if (!device) {
    throw new Error("Device not found");
  }

  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const payloadIdentifier =
    profile.payload_identifier ?? parseMobileConfigIdentifier(profile.payload);
  const commandUUID = newCommandUuid();

  await enqueueAndPush({
    udid: deviceId,
    commandUUID,
    command: buildInstallProfileCommand(profile.payload)
  });

  db.prepare(
    `INSERT INTO device_profiles (device_id, profile_id, status, command_uuid, installed_at)
     VALUES (?, ?, 'pending', ?, NULL)
     ON CONFLICT(device_id, profile_id) DO UPDATE SET
       status = 'pending',
       command_uuid = excluded.command_uuid,
       installed_at = NULL`
  ).run(deviceId, profileId, commandUUID);

  recordCommand({
    commandUUID,
    deviceId,
    commandType: "install_profile",
    refProfileId: profileId
  });

  return { commandUUID, payloadIdentifier };
}

export async function removeProfileFromDevice(deviceId, profileId) {
  const device = getDevice(deviceId);
  if (!device) {
    throw new Error("Device not found");
  }

  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const identifier =
    profile.payload_identifier ?? parseMobileConfigIdentifier(profile.payload);
  if (!identifier) {
    throw new Error("Profile identifier missing");
  }

  const commandUUID = newCommandUuid();
  await enqueueAndPush({
    udid: deviceId,
    commandUUID,
    command: buildRemoveProfileCommand(identifier)
  });

  db.prepare("DELETE FROM device_profiles WHERE device_id = ? AND profile_id = ?").run(
    deviceId,
    profileId
  );

  recordCommand({
    commandUUID,
    deviceId,
    commandType: "remove_profile",
    refProfileId: profileId
  });

  return { commandUUID };
}

export async function installGroupProfilesOnDevice(deviceId, groupId) {
  const rows = db
    .prepare(
      `SELECT profile_id AS profileId
       FROM group_profiles
       WHERE group_id = ?`
    )
    .all(groupId);

  const results = [];
  for (const row of rows) {
    results.push(await installProfileOnDevice(deviceId, row.profileId));
  }
  return results;
}

export async function pushGroupProfilesToMembers(groupId) {
  const devices = db
    .prepare("SELECT id FROM devices WHERE group_id = ?")
    .all(groupId);

  const results = [];
  for (const device of devices) {
    results.push(...(await installGroupProfilesOnDevice(device.id, groupId)));
  }
  return results;
}
