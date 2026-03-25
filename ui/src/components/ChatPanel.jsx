import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/appStyles";
import ChatBubble from "./ChatBubble";

function ChatPanel({
  messages,
  prompt,
  loading,
  onPromptChange,
  onSend,
  onUseLocation,
  inputHint,
  models,
  selectedModel,
  onModelChange,
  isSidebarOpen,
  onToggleSidebar,
  isRecommendationOpen,
  onToggleRecommendations
}) {
  return (
    <View style={styles.chatPanel}>
      <View style={styles.panelHeader}>
        <View style={styles.chatHeaderRow}>
          <View style={styles.chatHeaderLeft}>
            <Pressable style={styles.headerChipButton} onPress={onToggleSidebar}>
              <Text style={styles.headerChipButtonText}>{isSidebarOpen ? "Hide Menu" : "Show Menu"}</Text>
            </Pressable>
            <Text style={styles.panelHeaderText}>HeyPico Assistant</Text>
          </View>
          <Pressable style={styles.headerChipButton} onPress={onToggleRecommendations}>
            <Text style={styles.headerChipButtonText}>
              {isRecommendationOpen ? "Hide Recommendations" : "Show Recommendations"}
            </Text>
          </Pressable>
        </View>
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

      <View style={styles.composerWrap}>
        {inputHint ? <Text style={styles.inputHintText}>{inputHint}</Text> : null}
        <View style={styles.inputBar}>
        <select
          className="rn-model-select"
          value={selectedModel}
          onChange={(event) => onModelChange(event.target.value)}
          disabled={!models.length || loading}
        >
          {!models.length ? <option value="">No model</option> : null}
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
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
    </View>
  );
}

export default ChatPanel;
