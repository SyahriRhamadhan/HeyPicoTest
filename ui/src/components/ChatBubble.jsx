import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FiCheck, FiCopy } from "react-icons/fi";
import { styles } from "../styles/appStyles";

function ChatBubble({ role, text, meta }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={styles.bubbleStack}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={styles.bubbleText}>{text}</Text>
          {meta ? <Text style={styles.bubbleMeta}>{meta}</Text> : null}
        </View>
        <View style={[styles.messageActions, isUser ? styles.messageActionsUser : styles.messageActionsAssistant]}>
          <Pressable
            style={styles.messageActionButton}
            onPress={handleCopy}
            title={copied ? "Copied" : "Copy message"}
            accessibilityLabel="Copy message"
          >
            {copied ? <FiCheck size={13} color="#a7f3d0" /> : <FiCopy size={13} color="#b9c2d0" />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default ChatBubble;
