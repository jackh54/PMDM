import crypto from "node:crypto";
import plist from "plist";

export function newCommandUuid() {
  return crypto.randomUUID();
}

export function buildMdmCommandPlist(commandUUID, command) {
  return plist.build({
    CommandUUID: commandUUID,
    Command: command
  });
}

export function parseMobileConfigIdentifier(payloadBuffer) {
  const parsed = plist.parse(payloadBuffer);
  return parsed?.PayloadIdentifier ?? null;
}

export function buildInstallProfileCommand(profileBuffer) {
  return {
    RequestType: "InstallProfile",
    Payload: profileBuffer
  };
}

export function buildRemoveProfileCommand(identifier) {
  return {
    RequestType: "RemoveProfile",
    Identifier: identifier
  };
}

export function buildDeviceLockCommand(message = "Locked by PMDM administrator") {
  return {
    RequestType: "DeviceLock",
    Message: message
  };
}

export function buildEraseDeviceCommand() {
  return { RequestType: "EraseDevice" };
}

export function buildRestartDeviceCommand() {
  return { RequestType: "RestartDevice" };
}

export function buildDeviceInformationCommand(queries) {
  return {
    RequestType: "DeviceInformation",
    Queries: queries
  };
}

export function buildProfileListCommand() {
  return { RequestType: "ProfileList" };
}

export function buildSecurityInfoCommand() {
  return { RequestType: "SecurityInfo" };
}

export function buildInstalledApplicationListCommand() {
  return { RequestType: "InstalledApplicationList" };
}

export function buildClearPasscodeCommand(unlockToken) {
  const command = { RequestType: "ClearPasscode" };
  if (unlockToken) {
    command.UnlockToken = unlockToken;
  }
  return command;
}

export const DEFAULT_DEVICE_INFORMATION_QUERIES = [
  "UDID",
  "DeviceName",
  "OSVersion",
  "BuildVersion",
  "ModelName",
  "Model",
  "ProductName",
  "SerialNumber",
  "DeviceCapacity",
  "AvailableDeviceCapacity",
  "BatteryLevel",
  "IsSupervised",
  "IsDeviceLocatorServiceEnabled",
  "IsActivationLockEnabled",
  "IsCloudBackupEnabled",
  "WiFiMAC",
  "BluetoothMAC"
];
