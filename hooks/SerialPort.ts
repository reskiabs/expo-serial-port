import { DeviceEventEmitter, NativeModules } from "react-native";

const { SerialPortModule } = NativeModules;

// Tambahkan event baru di sini
type SerialEvents =
  | "onReadData"
  | "onError"
  | "onDeviceAttached"
  | "onDeviceDetached";

class SerialPort {
  static async connect(baudRate: number = 9600): Promise<string> {
    return SerialPortModule.initSerialPort(baudRate);
  }

  static async disconnect(): Promise<void> {
    // pakai invalidate dari native
    if (SerialPortModule.invalidate) {
      SerialPortModule.invalidate();
    }
  }

  static async send(data: string): Promise<string> {
    return SerialPortModule.sendCommand(data);
  }

  static on(event: SerialEvents, callback: (data: string) => void) {
    return DeviceEventEmitter.addListener(event, callback);
  }
}

export default SerialPort;
