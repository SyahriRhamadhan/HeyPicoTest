import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../appStyles";
import AppHeader from "./AppHeader";
import ChatBubble from "./ChatBubble";
import ComposerBar from "./ComposerBar";

function ChatPanel({
  models,
  selectedModel,
  isModelMenuOpen,
  onToggleModelMenu,
  onSelectModel,
  messages,
  loading,
  prompt,
  inputHint,
  scrollRef,
  onPromptChange,
  onSend,
  onUseLocation,
  onToggleSidebar,
  onOpenSettings,
  onToggleRecommendations,
  onEditLastUserMessage,
  onShowMapFromMessage,
  onCopyMessage,
  recommendationPanel = null
}) {
  const lastUserMessageIndex = [...messages]
    .map((message, index) => ({ role: message.role, index }))
    .filter((message) => message.role === "user")
    .map((message) => message.index)
    .pop();

  return (
    <View style={styles.chatPanel}>
      <AppHeader
        title="MapAi"
        models={models}
        selectedModel={selectedModel}
        isModelMenuOpen={isModelMenuOpen}
        modelDisabled={!models.length || loading}
        onToggleModelMenu={onToggleModelMenu}
        onSelectModel={onSelectModel}
        onUseLocation={onUseLocation}
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={onOpenSettings}
        onToggleRecommendations={onToggleRecommendations}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll}
          contentContainerStyle={styles.quickActionsContent}
        >
          <Pressable style={styles.quickActionChip} onPress={() => onPromptChange("cafe di Batam")}>
            <Text style={styles.quickActionText}>cafe di Batam</Text>
          </Pressable>
          <Pressable style={styles.quickActionChip} onPress={() => onPromptChange("restoran seafood di Batam")}>
            <Text style={styles.quickActionText}>restoran seafood di Batam</Text>
          </Pressable>
          <Pressable style={styles.quickActionChip} onPress={() => onPromptChange("tempat nongkrong dekat saya")}>
            <Text style={styles.quickActionText}>tempat nongkrong dekat saya</Text>
          </Pressable>
        </ScrollView>

        {messages.map((message, index) => (
          <ChatBubble
            key={`${message.role}-${index}`}
            role={message.role}
            text={message.text}
            meta={message.meta}
            canEdit={message.role === "user" && index === lastUserMessageIndex}
            onEdit={onEditLastUserMessage}
            onShowInMap={onShowMapFromMessage}
            onCopy={onCopyMessage}
          />
        ))}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : null}

        {recommendationPanel}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ComposerBar
        inputHint={inputHint}
        prompt={prompt}
        loading={loading}
        onPromptChange={onPromptChange}
        onSend={onSend}
      />
    </View>
  );
}

export default ChatPanel;
