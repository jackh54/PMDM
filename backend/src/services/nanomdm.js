import axios from "axios";
import { config } from "../config.js";
import { buildMdmCommandPlist } from "./mdm-commands.js";

const client = axios.create({
  baseURL: config.NANOMDM_URL,
  timeout: 30000,
  auth: {
    username: "nanomdm",
    password: config.NANOMDM_API_KEY
  }
});

export async function enqueueCommand({ udid, commandUUID, command }) {
  const plistBody = buildMdmCommandPlist(commandUUID, command);
  const { data } = await client.put(`/v1/enqueue/${encodeURIComponent(udid)}`, plistBody, {
    headers: { "Content-Type": "application/xml" }
  });
  return data;
}

export async function pushDevice(udid) {
  const { data } = await client.get(`/v1/push/${encodeURIComponent(udid)}`);
  return data;
}

export async function enqueueAndPush({ udid, commandUUID, command }) {
  const enqueueResult = await enqueueCommand({ udid, commandUUID, command });
  let pushResult = null;
  try {
    pushResult = await pushDevice(udid);
  } catch {
    // NanoMDM may already push as part of enqueue; continue if explicit push fails.
  }
  return { enqueueResult, pushResult };
}

export async function getDevice(udid) {
  const { data } = await client.get(`/v1/devices/${encodeURIComponent(udid)}`);
  return data;
}

export async function getPushCertForTopic(topic) {
  const { data } = await client.get("/v1/pushcert", {
    params: { topic }
  });
  return data;
}
