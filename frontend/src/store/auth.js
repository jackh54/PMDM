import { create } from "zustand";
import { api } from "../api/client.js";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("pmdm.token"),
  login: async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("pmdm.token", data.token);
    set({ token: data.token });
  },
  logout: () => {
    localStorage.removeItem("pmdm.token");
    set({ token: null });
  }
}));
