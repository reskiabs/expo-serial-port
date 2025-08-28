import ConnectButton from "@/components/ConnectButton";
import SerialPort from "@/hooks/SerialPort";
import { useSerialStore } from "@/hooks/useSerialStore";
import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

const App = () => {
  const [received, setReceived] = useState<string[]>([]);
  const { connected, disconnect } = useSerialStore();

  useEffect(() => {
    // Listener data masuk
    const subData = SerialPort.on("onReadData", (data) => {
      console.log("📩 Received:", data);
      setReceived((prev) => [...prev, data]);
    });

    // Listener error
    const subErr = SerialPort.on("onError", (err) => {
      console.log("❌ Serial error:", err);
      disconnect(); // otomatis matikan status kalau ada error
    });

    const subAttach = SerialPort.on("onDeviceAttached", () => {
      console.log("🔌 USB device attached");
    });

    const subDetach = SerialPort.on("onDeviceDetached", () => {
      console.log("❌ USB device detached");
      disconnect();
    });

    return () => {
      subData.remove();
      subErr.remove();
      subAttach.remove();
      subDetach.remove();
    };
  }, [disconnect]);

  const sendData = () => {
    const uid = "SCAN_UID";
    SerialPort.send(uid)
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
        📡 USB Serial App
      </Text>

      {/* ✅ Global button dari store */}
      <ConnectButton />

      <Button title="Kirim" onPress={sendData} />

      <Text
        style={{
          marginBottom: 10,
          marginTop: 20,
          fontWeight: "bold",
          color: "green",
        }}
      >
        Data masuk:
      </Text>
      {received.map((msg, idx) => (
        <Text style={{ fontSize: 16, color: "white" }} key={idx}>
          {msg}
        </Text>
      ))}
    </View>
  );
};

export default App;
