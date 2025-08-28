// hooks/useSerialStore.ts
import SerialPort from "@/hooks/SerialPort";
import { create } from "zustand";

type SerialState = {
  connected: boolean;
  connect: (baudRate?: number) => Promise<void>;
  disconnect: () => void;
};

export const useSerialStore = create<SerialState>((set) => ({
  connected: false,
  connect: async (baudRate = 9600) => {
    try {
      const msg = await SerialPort.connect(baudRate);
      console.log(msg);
      set({ connected: true });
    } catch (err) {
      console.log("Init error:", err);
      set({ connected: false });
    }
  },
  disconnect: () => {
    SerialPort.disconnect();
    set({ connected: false });
    console.log("🔌 Disconnected");
  },
}));
