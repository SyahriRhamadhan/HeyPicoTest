import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";

function ChatBubble({ role, text, meta }) {
  const isUser = role === "user";

  return (
    <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <Text style={styles.bubbleText}>{text}</Text>
      {meta ? <Text style={styles.bubbleMeta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

export default ChatBubble;
