import ConnectButton from "@/components/ConnectButton";
import { useSerialStore } from "@/hooks/useSerialStore";
import React from "react";
import { Button, Text, View } from "react-native";

const App = () => {
  const { received, send } = useSerialStore();

  const sendData = () => {
    send("SCAN_UID");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
        📡 USB Serial Demo
      </Text>

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
