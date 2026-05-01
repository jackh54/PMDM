import { api } from "./client.js";

export async function fetchDevices() {
  const { data } = await api.get("/devices");
  return data;
}

export async function fetchDevice(id) {
  const { data } = await api.get(`/devices/${id}`);
  return data;
}
