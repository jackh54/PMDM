import { pushDevice } from "./nanomdm.js";

export async function triggerPushForDevice(deviceId) {
  return pushDevice(deviceId);
}
