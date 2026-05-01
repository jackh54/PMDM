"use client";

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export const api = axios.create({
  baseURL: API_BASE
});

export function setApiToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
