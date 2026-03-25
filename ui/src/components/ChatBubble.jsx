import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FiCheck, FiCopy, FiEdit2 } from "react-icons/fi";
import { styles } from "../styles/appStyles";

const formatMeta = (meta) => {
  if (!meta) return "";
  if (typeof meta === "string") return meta;
  if (typeof meta === "number" || typeof meta === "boolean") return String(meta);

  if (typeof meta === "object") {
    const parts = [];

    if (meta.provider) {
      parts.push(`provider=${meta.provider}`);
    }

    if (meta.results !== undefined) {
      parts.push(`results=${meta.results}`);
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }

    try {
      return JSON.stringify(meta);
    } catch {
      return "";
    }
  }

  return "";
};

function ChatBubble({ role, text, meta, canEdit = false, onEdit }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const metaText = formatMeta(meta);

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
          {metaText ? <Text style={styles.bubbleMeta}>{metaText}</Text> : null}
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
          {isUser && canEdit ? (
            <Pressable
              style={styles.messageActionButton}
              title="Edit last user message"
              accessibilityLabel="Edit last user message"
              onPress={() => onEdit?.(text)}
            >
              <FiEdit2 size={13} color="#b9c2d0" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default ChatBubble;
