const SUPPORTED_COMMANDS = new Set(["lock", "wipe", "restart", "install_profile"]);

export function isSupportedMacCommand(commandType) {
  return SUPPORTED_COMMANDS.has(commandType);
}

export function toAppleRequestType(commandType) {
  switch (commandType) {
    case "lock":
      return "DeviceLock";
    case "wipe":
      return "EraseDevice";
    case "restart":
      return "RestartDevice";
    case "install_profile":
      return "InstallProfile";
    default:
      return null;
  }
}
