// hooks/useSerialStore.ts
import SerialPort from "@/hooks/SerialPort";
import { DeviceEventEmitter } from "react-native";
import { create } from "zustand";

type SerialState = {
  connected: boolean;
  received: string[];
  connect: (baudRate?: number) => Promise<void>;
  disconnect: () => void;
  send: (data: string) => Promise<void>;
};

export const useSerialStore = create<SerialState>((set, get) => {
  // Pasang listener global sekali saja
  DeviceEventEmitter.addListener("onReadData", (data) => {
    set((state) => ({ received: [...state.received, data] }));
  });

  DeviceEventEmitter.addListener("onError", (err) => {
    console.log("❌ Serial error:", err);
    set({ connected: false });
  });

  DeviceEventEmitter.addListener("onDeviceAttached", () => {
    console.log("🔌 USB device attached");
  });

  DeviceEventEmitter.addListener("onDeviceDetached", () => {
    console.log("❌ USB device detached");
    set({ connected: false });
  });

  DeviceEventEmitter.addListener("onConnected", () => {
    console.log("✅ Serial connected");
    set({ connected: true });
  });

  DeviceEventEmitter.addListener("onDisconnected", () => {
    console.log("🔌 Serial disconnected");
    set({ connected: false });
  });

  return {
    connected: false,
    received: [],
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
    },
    send: async (data: string) => {
      try {
        await SerialPort.send(data);
      } catch (err) {
        console.log("Send error:", err);
      }
    },
  };
});
