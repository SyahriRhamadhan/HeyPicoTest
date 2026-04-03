import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import IconGlyph from "./IconGlyph";
import { copyText } from "../utils/platform";

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

function ChatBubble({ role, text, meta, canEdit = false, onEdit, onShowInMap }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const metaText = formatMeta(meta);
  const canShowInMap =
    !isUser && meta && typeof meta === "object" && Array.isArray(meta.places) && meta.places.length > 0;

  const handleCopy = async () => {
    try {
      const ok = await copyText(text);
      if (!ok) {
        setCopied(false);
        return;
      }

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
          {canShowInMap ? (
            <Pressable
              style={styles.messageMapActionButton}
              onPress={() => onShowInMap?.(meta)}
              title="Show in map"
              accessibilityLabel="Show in map"
            >
              <Text style={styles.messageMapActionText}>Show in map</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.messageActionButton}
            onPress={handleCopy}
            title={copied ? "Copied" : "Copy message"}
            accessibilityLabel="Copy message"
          >
            {copied ? (
              <IconGlyph name="check" style={styles.iconGlyphSuccess} />
            ) : (
              <IconGlyph name="copy" style={styles.iconGlyphMuted} />
            )}
          </Pressable>

          {isUser && canEdit ? (
            <Pressable
              style={styles.messageActionButton}
              title="Edit last user message"
              accessibilityLabel="Edit last user message"
              onPress={() => onEdit?.(text)}
            >
              <IconGlyph name="edit" style={styles.iconGlyphMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default ChatBubble;
