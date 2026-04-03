import { Pressable, Text, View } from "react-native";
import { styles } from "../appStyles";
import { formatMeta } from "../mobileHelpers";

function ChatBubble({ role, text, meta, canEdit = false, onEdit, onShowInMap, onCopy }) {
  const isUser = role === "user";
  const metaText = formatMeta({ meta });
  const canShowInMap =
    !isUser && meta && typeof meta === "object" && Array.isArray(meta.places) && meta.places.length > 0;

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <View style={styles.messageBubbleWrap}>
        <Pressable
          onLongPress={() => onCopy?.(text)}
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant
          ]}
        >
          <Text style={styles.messageText}>{text}</Text>
          {metaText ? <Text style={styles.metaText}>{metaText}</Text> : null}
        </Pressable>

        <View style={[styles.messageActions, isUser ? styles.messageActionsUser : styles.messageActionsAssistant]}>
          {canShowInMap ? (
            <Pressable style={styles.messageActionChip} onPress={() => onShowInMap?.(meta)}>
              <Text style={styles.messageActionChipText}>Show in map</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.messageActionChip} onPress={() => onCopy?.(text)}>
            <Text style={styles.messageActionChipText}>Copy</Text>
          </Pressable>
          {isUser && canEdit ? (
            <Pressable style={styles.messageActionChip} onPress={() => onEdit?.(text)}>
              <Text style={styles.messageActionChipText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default ChatBubble;
