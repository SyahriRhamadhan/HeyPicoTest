import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { FiArchive, FiBookmark, FiEdit2, FiMenu, FiMoreHorizontal, FiPlus, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import { styles } from "../styles/appStyles";

function Sidebar({
  isOpen,
  onToggle,
  chatView,
  onChangeChatView,
  sessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onUnarchiveChat,
  onDeleteChat
}) {
  const [menuChatId, setMenuChatId] = useState("");
  const [renameChatId, setRenameChatId] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const openRename = (session) => {
    setRenameChatId(session.id);
    setRenameValue(session.title || "");
    setMenuChatId("");
  };

  const submitRename = (chatId) => {
    const title = String(renameValue || "").trim();
    if (!title) return;
    onRenameChat?.(chatId, title);
    setRenameChatId("");
    setRenameValue("");
  };

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
      <View style={styles.historyViewTabs}>
        <Pressable
          style={[styles.historyViewTab, chatView === "active" && styles.historyViewTabActive]}
          onPress={() => onChangeChatView?.("active")}
        >
          <Text style={[styles.historyViewTabText, chatView === "active" && styles.historyViewTabTextActive]}>
            Active
          </Text>
        </Pressable>
        <Pressable
          style={[styles.historyViewTab, chatView === "archived" && styles.historyViewTabActive]}
          onPress={() => onChangeChatView?.("archived")}
        >
          <Text style={[styles.historyViewTabText, chatView === "archived" && styles.historyViewTabTextActive]}>
            Archived
          </Text>
        </Pressable>
      </View>
      <View style={styles.historyList}>
        {sessions.length === 0 ? (
          <Text style={styles.historyEmptyText}>
            {chatView === "archived" ? "No archived chats." : "No chats yet."}
          </Text>
        ) : null}
        {sessions.map((session) => (
          <View key={session.id} style={styles.historyItemWrap}>
            {renameChatId === session.id ? (
              <View style={[styles.historyItem, styles.historyItemEdit]}>
                <TextInput
                  style={styles.historyRenameInput}
                  value={renameValue}
                  onChangeText={setRenameValue}
                  onSubmitEditing={() => submitRename(session.id)}
                  autoFocus
                  placeholder="Rename chat"
                  placeholderTextColor="#8890a0"
                />
                <View style={styles.historyEditActions}>
                  <Pressable style={styles.historyEditButton} onPress={() => submitRename(session.id)}>
                    <Text style={styles.historyEditButtonText}>Save</Text>
                  </Pressable>
                  <Pressable
                    style={styles.historyEditButton}
                    onPress={() => {
                      setRenameChatId("");
                      setRenameValue("");
                    }}
                  >
                    <Text style={styles.historyEditButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.historyItem, session.id === activeChatId && styles.historyItemActive]}>
                <Pressable style={styles.historyMainButton} onPress={() => onSelectChat(session.id)}>
                  <Text style={styles.historyItemText} numberOfLines={1}>
                    {session.title}
                  </Text>
                  {session.pinned ? <FiBookmark size={12} color="#9dc1ff" /> : null}
                </Pressable>
                <Pressable
                  style={styles.historyMenuButton}
                  onPress={() => setMenuChatId((current) => (current === session.id ? "" : session.id))}
                  title="Chat menu"
                  accessibilityLabel="Chat menu"
                >
                  <FiMoreHorizontal size={14} color="#aab3c0" />
                </Pressable>
              </View>
            )}

            {menuChatId === session.id ? (
              <View style={styles.historyMenuCard}>
                <Pressable style={styles.historyMenuItem} onPress={() => openRename(session)}>
                  <FiEdit2 size={13} color="#d8dee7" />
                  <Text style={styles.historyMenuText}>Rename</Text>
                </Pressable>
                <Pressable
                  style={styles.historyMenuItem}
                  onPress={() => {
                    onPinChat?.(session.id, !session.pinned);
                    setMenuChatId("");
                  }}
                >
                  <FiBookmark size={13} color="#d8dee7" />
                  <Text style={styles.historyMenuText}>{session.pinned ? "Unpin chat" : "Pin chat"}</Text>
                </Pressable>
                <Pressable
                  style={styles.historyMenuItem}
                  onPress={() => {
                    if (session.archived) onUnarchiveChat?.(session.id);
                    else onArchiveChat?.(session.id);
                    setMenuChatId("");
                  }}
                >
                  <FiArchive size={13} color="#d8dee7" />
                  <Text style={styles.historyMenuText}>{session.archived ? "Unarchive" : "Archive"}</Text>
                </Pressable>
                <Pressable
                  style={[styles.historyMenuItem, styles.historyMenuItemDanger]}
                  onPress={() => {
                    onDeleteChat?.(session.id);
                    setMenuChatId("");
                  }}
                >
                  <FiTrash2 size={13} color="#ff9d9d" />
                  <Text style={[styles.historyMenuText, styles.historyMenuTextDanger]}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
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
