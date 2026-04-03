import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatPanel from "./src/components/ChatPanel";
import MapPanel from "./src/components/MapPanel";
import SettingsModal from "./src/components/SettingsModal";
import Sidebar from "./src/components/Sidebar";
import { styles } from "./src/appStyles";
import { useAppController } from "./src/hooks/useAppController";

export default function App() {
  const controller = useAppController();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Sidebar
            isOpen={controller.isSidebarOpen}
            onToggle={() => controller.setIsSidebarOpen((current) => !current)}
            chatView={controller.chatView}
            onChangeChatView={controller.setChatView}
            sessions={controller.chatSessions}
            activeChatId={controller.activeChatId}
            onSelectChat={controller.handleSelectChat}
            onNewChat={controller.handleNewChat}
            onOpenSettings={() => controller.setIsSettingsOpen(true)}
            onRenameChat={controller.handleRenameChat}
            onPinChat={controller.handlePinChat}
            onArchiveChat={(chatId) => controller.handleArchiveChat(chatId, true)}
            onUnarchiveChat={(chatId) => controller.handleArchiveChat(chatId, false)}
            onDeleteChat={controller.handleDeleteChat}
          />

          <ChatPanel
            statusMessage={controller.statusMessage}
            locationLabel={controller.locationLabel}
            models={controller.models}
            selectedModel={controller.selectedModel}
            isModelMenuOpen={controller.isModelMenuOpen}
            onToggleModelMenu={() => controller.setIsModelMenuOpen((current) => !current)}
            onSelectModel={(value) => {
              controller.setSelectedModel(value);
              controller.setIsModelMenuOpen(false);
            }}
            messages={controller.activeChat?.messages || []}
            loading={controller.loading}
            prompt={controller.prompt}
            inputHint={controller.inputHint}
            scrollRef={controller.scrollRef}
            onPromptChange={controller.handlePromptChange}
            onSend={controller.handleSend}
            onUseLocation={controller.handleUseLocation}
            onToggleSidebar={() => controller.setIsSidebarOpen(true)}
            onOpenSettings={() => controller.setIsSettingsOpen(true)}
            onToggleRecommendations={() =>
              controller.setIsRecommendationOpen((current) => !current)
            }
            onEditLastUserMessage={controller.handleEditLastUserMessage}
            onShowMapFromMessage={controller.handleShowMapFromMessage}
            onCopyMessage={controller.handleCopyMessage}
          />

          {controller.isRecommendationOpen ? (
            <MapPanel
              places={controller.activeChat?.places || []}
              selectedPlace={controller.selectedPlace}
              selectedPlaceIndex={controller.activeChat?.selectedPlaceIndex || 0}
              onSelectPlace={controller.handleSelectPlace}
              onOpenDirections={controller.handleOpenDirections}
              mapRegion={controller.mapRegion}
            />
          ) : null}

          {controller.isSettingsOpen ? (
            <SettingsModal
              onClose={() => controller.setIsSettingsOpen(false)}
              onClearCurrent={controller.handleClearCurrentMemory}
              onClearAll={controller.handleClearAllMemory}
              canClearCurrent={Boolean(controller.activeChat?.id && controller.apiConfigured)}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
