import { api } from "./client.js";

export async function lockDevice(deviceId) {
  return api.post("/commands/lock", { device_id: deviceId });
}

export async function restartDevice(deviceId) {
  return api.post("/commands/restart", { device_id: deviceId });
}

export async function wipeDevice(deviceId) {
  return api.post("/commands/wipe", { device_id: deviceId });
}

export async function fetchCommandHistory(deviceId) {
  const { data } = await api.get(`/commands/${deviceId}`);
  return data;
}
