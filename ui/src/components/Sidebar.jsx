import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";

function Sidebar({ isOpen, onToggle, sessions, activeChatId, onSelectChat, onNewChat }) {
  if (!isOpen) {
    return (
      <View style={styles.sidebarCollapsed}>
        <Pressable style={styles.sidebarToggleButton} onPress={onToggle}>
          <Text style={styles.sidebarToggleText}>☰</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarBrand}>HeyPico</Text>
        <Pressable style={styles.sidebarToggleButton} onPress={onToggle}>
          <Text style={styles.sidebarToggleText}>✕</Text>
        </Pressable>
      </View>
      <Pressable style={styles.newChatButton} onPress={onNewChat}>
        <Text style={styles.newChatButtonText}>+ New chat</Text>
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
    </View>
  );
}

export default Sidebar;
