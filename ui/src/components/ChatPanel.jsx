import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FiMap, FiMenu, FiNavigation, FiSend, FiSidebar } from "react-icons/fi";
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
            <Pressable
              style={styles.iconButton}
              onPress={onToggleSidebar}
              title={isSidebarOpen ? "Hide menu" : "Show menu"}
              accessibilityLabel={isSidebarOpen ? "Hide menu" : "Show menu"}
            >
              {isSidebarOpen ? <FiSidebar size={14} color="#d6d6d6" /> : <FiMenu size={14} color="#d6d6d6" />}
            </Pressable>
            <Text style={styles.panelHeaderText}>HeyPico Assistant</Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={onToggleRecommendations}
            title={isRecommendationOpen ? "Hide recommendations" : "Show recommendations"}
            accessibilityLabel={isRecommendationOpen ? "Hide recommendations" : "Show recommendations"}
          >
            <FiMap size={14} color="#d6d6d6" />
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
        <Pressable
          style={[styles.iconActionButton, loading && styles.buttonDisabled]}
          onPress={onSend}
          disabled={loading}
          title="Send"
          accessibilityLabel="Send"
        >
          <FiSend size={14} color="#111" />
        </Pressable>
        <Pressable
          style={[styles.iconActionButton, styles.locationButton]}
          onPress={onUseLocation}
          title="Use location"
          accessibilityLabel="Use location"
        >
          <FiNavigation size={14} color="#fff" />
        </Pressable>
        </View>
      </View>
    </View>
  );
}

export default ChatPanel;
