import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/appStyles";
import IconGlyph from "./IconGlyph";

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
    return null;
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarBrand}>MapAi</Text>
        <Pressable style={styles.sidebarToggleButton} onPress={onToggle} title="Hide menu" accessibilityLabel="Hide menu">
          <IconGlyph name="close" style={styles.iconGlyph} />
        </Pressable>
      </View>

      <Pressable style={styles.newChatButton} onPress={onNewChat} title="New chat" accessibilityLabel="New chat">
        <IconGlyph name="new" style={styles.iconGlyphLight} />
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

      <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyList}>
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
                  {session.pinned ? <IconGlyph name="bookmark" style={styles.iconGlyphSmallAccent} /> : null}
                </Pressable>
                <Pressable
                  style={styles.historyMenuButton}
                  onPress={() => setMenuChatId((current) => (current === session.id ? "" : session.id))}
                  title="Chat menu"
                  accessibilityLabel="Chat menu"
                >
                  <IconGlyph name="more" style={styles.iconGlyphMuted} />
                </Pressable>
              </View>
            )}

            {menuChatId === session.id ? (
              <View style={styles.historyMenuCard}>
                <Pressable style={styles.historyMenuItem} onPress={() => openRename(session)}>
                  <IconGlyph name="edit" style={styles.iconGlyphLight} />
                  <Text style={styles.historyMenuText}>Rename</Text>
                </Pressable>
                <Pressable
                  style={styles.historyMenuItem}
                  onPress={() => {
                    onPinChat?.(session.id, !session.pinned);
                    setMenuChatId("");
                  }}
                >
                  <IconGlyph name="bookmark" style={styles.iconGlyphLight} />
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
                  <IconGlyph name="archive" style={styles.iconGlyphLight} />
                  <Text style={styles.historyMenuText}>{session.archived ? "Unarchive" : "Archive"}</Text>
                </Pressable>
                <Pressable
                  style={[styles.historyMenuItem, styles.historyMenuItemDanger]}
                  onPress={() => {
                    onDeleteChat?.(session.id);
                    setMenuChatId("");
                  }}
                >
                  <IconGlyph name="trash" style={styles.iconGlyphDanger} />
                  <Text style={[styles.historyMenuText, styles.historyMenuTextDanger]}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Pressable
          style={styles.settingsButton}
          onPress={onOpenSettings}
          title="Memory settings"
          accessibilityLabel="Memory settings"
        >
          <IconGlyph name="settings" style={styles.iconGlyphLight} />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default Sidebar;
