import { create } from "zustand";
import { fetchDevices } from "../api/devices.js";

export const useDevicesStore = create((set) => ({
  items: [],
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const items = await fetchDevices();
      set({ items });
    } finally {
      set({ loading: false });
    }
  }
}));
