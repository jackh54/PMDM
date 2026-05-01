import axios from "axios";
import { config } from "../config.js";

const client = axios.create({
  baseURL: config.NANOMDM_URL,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${config.NANOMDM_API_KEY}`
  }
});

export async function enqueueCommand({ udid, requestType, commandUUID, payload = {} }) {
  const body = {
    udid,
    command_uuid: commandUUID,
    command: {
      RequestType: requestType,
      ...payload
    }
  };

  const { data } = await client.post("/v1/commands", body);
  return data;
}

export async function getDevice(udid) {
  const { data } = await client.get(`/v1/devices/${encodeURIComponent(udid)}`);
  return data;
}
