import SerialPort from "@/hooks/SerialPort";
import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

const App = () => {
  const [received, setReceived] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  console.log("🔍 > App > connected:", connected);

  useEffect(() => {
    // Listener data masuk
    const subData = SerialPort.on("onReadData", (data) => {
      console.log("📩 Received:", data);
      setReceived((prev) => [...prev, data]);
    });

    // Listener error
    const subErr = SerialPort.on("onError", (err) => {
      console.log("❌ Serial error:", err);
      setConnected(false); // otomatis matikan status kalau ada error
    });

    return () => {
      subData.remove();
      subErr.remove();
    };
  }, []);

  useEffect(() => {
    const subAttach = SerialPort.on("onDeviceAttached", () => {
      console.log("🔌 USB device attached");
      // Bisa auto-connect kalau mau
      SerialPort.connect(9600).then(() => setConnected(true));
    });

    const subDetach = SerialPort.on("onDeviceDetached", () => {
      console.log("❌ USB device detached");
      setConnected(false);
    });

    return () => {
      subAttach.remove();
      subDetach.remove();
    };
  }, []);

  const handleConnect = () => {
    if (!connected) {
      // coba connect manual
      SerialPort.connect(9600)
        .then((msg) => {
          console.log(msg);
          setConnected(true);
        })
        .catch((err) => {
          console.log("Init error:", err);
          setConnected(false);
        });
    } else {
      // disconnect manual
      SerialPort.disconnect();
      setConnected(false);
      console.log("🔌 Disconnected");
    }
  };

  const sendData = () => {
    const uid = "SCAN_UID";
    SerialPort.send(uid)
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
        📡 USB Serial Demo
      </Text>

      <Button
        title={connected ? "Disconnect" : "Connect"}
        onPress={handleConnect}
        color={connected ? "#0adfd4ff" : "red"}
      />

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
