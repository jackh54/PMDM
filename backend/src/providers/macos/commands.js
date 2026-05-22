import {
  buildClearPasscodeCommand,
  buildDeviceInformationCommand,
  buildDeviceLockCommand,
  buildEraseDeviceCommand,
  buildInstalledApplicationListCommand,
  buildInstallProfileCommand,
  buildProfileListCommand,
  buildRemoveProfileCommand,
  buildRestartDeviceCommand,
  buildSecurityInfoCommand,
  DEFAULT_DEVICE_INFORMATION_QUERIES
} from "../../services/mdm-commands.js";

const SUPPORTED_COMMANDS = new Set([
  "lock",
  "wipe",
  "restart",
  "install_profile",
  "remove_profile",
  "device_information",
  "profile_list",
  "security_info",
  "installed_application_list",
  "clear_passcode",
  "custom"
]);

export function isSupportedMacCommand(commandType) {
  return SUPPORTED_COMMANDS.has(commandType);
}

export function buildMacCommand(commandType, payload = {}) {
  switch (commandType) {
    case "lock":
      return buildDeviceLockCommand(payload.message);
    case "wipe":
      return buildEraseDeviceCommand();
    case "restart":
      return buildRestartDeviceCommand();
    case "install_profile":
      if (!payload.profileBuffer) {
        throw new Error("install_profile requires profileBuffer");
      }
      return buildInstallProfileCommand(payload.profileBuffer);
    case "remove_profile":
      if (!payload.identifier) {
        throw new Error("remove_profile requires identifier");
      }
      return buildRemoveProfileCommand(payload.identifier);
    case "device_information":
      return buildDeviceInformationCommand(payload.queries ?? DEFAULT_DEVICE_INFORMATION_QUERIES);
    case "profile_list":
      return buildProfileListCommand();
    case "security_info":
      return buildSecurityInfoCommand();
    case "installed_application_list":
      return buildInstalledApplicationListCommand();
    case "clear_passcode":
      return buildClearPasscodeCommand(payload.unlockToken);
    case "custom":
      if (!payload.requestType) {
        throw new Error("custom command requires requestType");
      }
      return {
        RequestType: payload.requestType,
        ...(payload.command ?? {})
      };
    default:
      return null;
  }
}

/** @deprecated use buildMacCommand */
export function toAppleRequestType(commandType) {
  const command = buildMacCommand(commandType);
  return command?.RequestType ?? null;
}
