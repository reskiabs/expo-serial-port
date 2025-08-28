// components/ConnectButton.tsx
import { useSerialStore } from "@/hooks/useSerialStore";
import React from "react";
import { Button } from "react-native";

const ConnectButton = () => {
  const { connected, connect, disconnect } = useSerialStore();
  console.log("🔍 > ConnectButton > connected:", connected);

  const handlePress = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <Button
      title={connected ? "Disconnect" : "Connect"}
      onPress={handlePress}
      color={connected ? "#0adfd4ff" : "red"}
    />
  );
};

export default ConnectButton;
