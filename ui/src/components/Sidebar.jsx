import { Pressable, Text, View } from "react-native";
import { FiMenu, FiPlus, FiSettings, FiX } from "react-icons/fi";
import { styles } from "../styles/appStyles";

function Sidebar({
  isOpen,
  onToggle,
  sessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onOpenSettings
}) {
  if (!isOpen) {
    return (
      <View style={styles.sidebarCollapsed}>
        <Pressable
          style={styles.sidebarToggleButton}
          onPress={onToggle}
          title="Show menu"
          accessibilityLabel="Show menu"
        >
          <FiMenu size={14} color="#d6d6d6" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarBrand}>HeyPico</Text>
        <Pressable
          style={styles.sidebarToggleButton}
          onPress={onToggle}
          title="Hide menu"
          accessibilityLabel="Hide menu"
        >
          <FiX size={14} color="#d6d6d6" />
        </Pressable>
      </View>
      <Pressable
        style={styles.newChatButton}
        onPress={onNewChat}
        title="New chat"
        accessibilityLabel="New chat"
      >
        <FiPlus size={14} color="#ececec" />
        <Text style={styles.newChatButtonText}>New chat</Text>
      </Pressable>
      <View style={styles.historyList}>
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            style={[styles.historyItem, session.id === activeChatId && styles.historyItemActive]}
            onPress={() => onSelectChat(session.id)}
          >
            <Text style={styles.historyItemText}>{session.title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sidebarFooter}>
        <Pressable
          style={styles.settingsButton}
          onPress={onOpenSettings}
          title="Memory settings"
          accessibilityLabel="Memory settings"
        >
          <FiSettings size={14} color="#cfcfcf" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default Sidebar;
