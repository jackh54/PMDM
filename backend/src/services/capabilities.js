import { isSupportedMacCommand } from "../providers/macos/commands.js";
import { isSupportedWindowsCommand } from "../providers/windows/commands.js";

export function canRunCommand(platformType, commandType) {
  if (platformType === "macos") {
    return isSupportedMacCommand(commandType);
  }
  if (platformType === "windows") {
    return isSupportedWindowsCommand(commandType);
  }
  return false;
}
