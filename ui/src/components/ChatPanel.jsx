import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/appStyles";
import ChatBubble from "./ChatBubble";

function ChatPanel({
  messages,
  prompt,
  loading,
  onPromptChange,
  onSend,
  onUseLocation
}) {
  return (
    <View style={styles.chatPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelHeaderText}>HeyPico Assistant</Text>
      </View>

      <ScrollView style={styles.chatLog} contentContainerStyle={styles.chatContent}>
        {messages.map((message, index) => (
          <ChatBubble
            key={`${message.role}-${index}`}
            role={message.role}
            text={message.text}
            meta={message.meta}
          />
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.promptInput}
          value={prompt}
          onChangeText={onPromptChange}
          onSubmitEditing={onSend}
          placeholder="Ask anything or search places..."
          placeholderTextColor="#8c99b8"
        />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSend} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Sending..." : "Send"}</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.locationButton]} onPress={onUseLocation}>
          <Text style={[styles.buttonText, styles.locationButtonText]}>Use Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default ChatPanel;
