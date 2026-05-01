"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useApi(getter, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const result = await getter();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || "Request failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, setData };
}

export async function getDevices() {
  const { data } = await api.get("/devices");
  return data;
}

export async function getDevice(id) {
  const { data } = await api.get(`/devices/${id}`);
  return data;
}

export async function getProfiles() {
  const { data } = await api.get("/profiles");
  return data;
}

export async function getGroups() {
  const { data } = await api.get("/groups");
  return data;
}

export async function getSettings() {
  const { data } = await api.get("/settings/status");
  return data;
}
