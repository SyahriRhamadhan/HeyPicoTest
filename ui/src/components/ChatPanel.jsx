import { useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/appStyles";
import ChatBubble from "./ChatBubble";
import IconGlyph from "./IconGlyph";
import OptionPicker from "./OptionPicker";

function ChatPanel({
  messages,
  prompt,
  loading,
  isMobile = false,
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
  onToggleRecommendations,
  onOpenSettings,
  onEditLastUserMessage,
  onShowMapFromMessage
}) {
  const scrollRef = useRef(null);
  const isWeb = Platform.OS === "web";
  const modelOptions = models.map((model) => ({ label: model, value: model }));

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const lastUserMessageIndex = [...messages]
    .map((message, index) => ({ role: message.role, index }))
    .filter((message) => message.role === "user")
    .map((message) => message.index)
    .pop();

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
              {isSidebarOpen ? (
                <IconGlyph name="sidebar" style={styles.iconGlyph} />
              ) : (
                <IconGlyph name="menu" style={styles.iconGlyph} />
              )}
            </Pressable>
            <Text style={styles.panelHeaderText}>MapAi</Text>
          </View>

          <View style={styles.chatHeaderRight}>
            <Pressable style={styles.iconButton} onPress={onOpenSettings} title="Open settings" accessibilityLabel="Open settings">
              <IconGlyph name="settings" style={styles.iconGlyph} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={onToggleRecommendations}
              title={isRecommendationOpen ? "Hide recommendations" : "Show recommendations"}
              accessibilityLabel={isRecommendationOpen ? "Hide recommendations" : "Show recommendations"}
            >
              <IconGlyph name="map" style={styles.iconGlyph} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatLog}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
      >
        {messages.map((message, index) => (
          <ChatBubble
            key={`${message.role}-${index}`}
            role={message.role}
            text={message.text}
            meta={message.meta}
            canEdit={message.role === "user" && index === lastUserMessageIndex}
            onEdit={onEditLastUserMessage}
            onShowInMap={onShowMapFromMessage}
          />
        ))}
      </ScrollView>

      <View style={styles.composerWrap}>
        {inputHint ? <Text style={styles.inputHintText}>{inputHint}</Text> : null}

        <View style={styles.inputBar}>
          {!isMobile ? (
            <OptionPicker
              value={selectedModel}
              onChange={onModelChange}
              options={modelOptions}
              placeholder="No model"
              disabled={!models.length || loading}
              compact={isWeb}
            />
          ) : null}

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
            {loading ? <Text style={styles.buttonText}>...</Text> : <IconGlyph name="send" style={styles.iconGlyphDark} />}
          </Pressable>

          <Pressable
            style={[styles.iconActionButton, styles.locationButton]}
            onPress={onUseLocation}
            title="Use location"
            accessibilityLabel="Use location"
          >
            <IconGlyph name="navigation" style={styles.iconGlyphLight} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default ChatPanel;
