import { api } from "./client.js";

export async function fetchProfiles() {
  const { data } = await api.get("/profiles");
  return data;
}

export async function createProfile(payload) {
  const { data } = await api.post("/profiles", payload);
  return data;
}
