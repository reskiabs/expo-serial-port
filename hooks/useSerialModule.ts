import { NativeEventEmitter, NativeModules } from "react-native";

const { SerialPortModule } = NativeModules;
const serialEmitter = new NativeEventEmitter(SerialPortModule);

export function initSerial(baud = 115200) {
  return SerialPortModule.initSerialPort(baud);
}

export function sendCommand(cmd: string) {
  return SerialPortModule.sendCommand(cmd);
}

export function listenSerial(callback: (data: string) => void) {
  const sub = serialEmitter.addListener("onReadData", callback);
  return () => sub.remove();
}

export function listenError(callback: (err: string) => void) {
  const sub = serialEmitter.addListener("onError", callback);
  return () => sub.remove();
}
