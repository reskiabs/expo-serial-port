import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import {
  initSerial,
  listenError,
  listenSerial,
  sendCommand,
} from "../../hooks/useSerialModule";

export default function HomeScreen() {
  const [command, setCommand] = useState("SCAN_UID");

  useEffect(() => {
    // init serial ketika screen mount
    initSerial(115200)
      .then((res: string) => console.log("✅ Init:", res))
      .catch((err: any) => console.log("❌ Error Init:", err));

    // listen response
    const unsubData = listenSerial((data: string) => {
      console.log("📩 Response:", data);
    });

    const unsubError = listenError((err: string) => {
      console.log("🚨 Serial Error:", err);
    });

    return () => {
      unsubData();
      unsubError();
    };
  }, []);

  const handleSend = () => {
    if (!command.trim()) return;
    sendCommand(command)
      .then((res: string) => console.log("📤 Sent:", res))
      .catch((err: any) => console.log("❌ Error Send:", err));
    setCommand("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔌 Serial Command</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter command..."
        value={command}
        onChangeText={setCommand}
      />

      <Button title="Send Command" onPress={handleSend} color="#0a8df2ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
});
