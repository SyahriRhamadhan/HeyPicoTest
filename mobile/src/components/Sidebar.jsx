import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../appStyles";
import AnimatedPressable from "./AnimatedPressable";

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

  if (!isOpen) return null;

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

  return (
    <View style={styles.drawerOverlay}>
      <AnimatedPressable style={styles.pressableReset} onPress={onToggle}>
        <View style={styles.drawerBackdrop} />
      </AnimatedPressable>

      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarBrand}>MapAi</Text>
          <AnimatedPressable style={styles.pressableReset} onPress={onToggle}>
            <View style={styles.sidebarCloseButton}>
              <Text style={styles.sidebarCloseText}>×</Text>
            </View>
          </AnimatedPressable>
        </View>

        <AnimatedPressable style={styles.pressableReset} onPress={onNewChat}>
          <View style={styles.sidebarPrimaryButton}>
            <Text style={styles.sidebarPrimaryButtonText}>New chat</Text>
          </View>
        </AnimatedPressable>

        <View style={styles.sidebarTabs}>
          <AnimatedPressable style={styles.pressableGrow} onPress={() => onChangeChatView?.("active")}>
            <View style={[styles.sidebarTab, chatView === "active" && styles.sidebarTabActive]}>
              <Text style={[styles.sidebarTabText, chatView === "active" && styles.sidebarTabTextActive]}>
                Active
              </Text>
            </View>
          </AnimatedPressable>
          <AnimatedPressable style={styles.pressableGrow} onPress={() => onChangeChatView?.("archived")}>
            <View style={[styles.sidebarTab, chatView === "archived" && styles.sidebarTabActive]}>
              <Text style={[styles.sidebarTabText, chatView === "archived" && styles.sidebarTabTextActive]}>
                Archived
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarList}>
          {sessions.length === 0 ? (
            <Text style={styles.sidebarEmptyText}>
              {chatView === "archived" ? "No archived chats." : "No chats yet."}
            </Text>
          ) : null}

          {sessions.map((session) => (
            <View key={session.id} style={styles.sidebarItemWrap}>
              {renameChatId === session.id ? (
                <View style={styles.sidebarRenameCard}>
                  <TextInput
                    style={styles.sidebarRenameInput}
                    value={renameValue}
                    onChangeText={setRenameValue}
                    onSubmitEditing={() => submitRename(session.id)}
                    autoFocus
                    placeholder="Rename chat"
                    placeholderTextColor="#8d97a7"
                  />
                  <View style={styles.sidebarRenameActions}>
                    <AnimatedPressable style={styles.pressableGrow} onPress={() => submitRename(session.id)}>
                      <View style={styles.sidebarRenameButton}>
                        <Text style={styles.sidebarRenameButtonText}>Save</Text>
                      </View>
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={styles.pressableGrow}
                      onPress={() => {
                        setRenameChatId("");
                        setRenameValue("");
                      }}
                    >
                      <View style={styles.sidebarRenameButton}>
                        <Text style={styles.sidebarRenameButtonText}>Cancel</Text>
                      </View>
                    </AnimatedPressable>
                  </View>
                </View>
              ) : (
                <View style={[styles.sidebarItem, session.id === activeChatId && styles.sidebarItemActive]}>
                  <AnimatedPressable style={styles.pressableGrow} onPress={() => onSelectChat(session.id)}>
                    <View style={styles.sidebarItemMain}>
                      <Text style={styles.sidebarItemText} numberOfLines={1}>
                        {session.title}
                      </Text>
                      {session.pinned ? <Text style={styles.sidebarPin}>★</Text> : null}
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.pressableReset}
                    onPress={() => setMenuChatId((current) => (current === session.id ? "" : session.id))}
                  >
                    <View style={styles.sidebarMenuButton}>
                      <Text style={styles.sidebarMenuButtonText}>⋯</Text>
                    </View>
                  </AnimatedPressable>
                </View>
              )}

              {menuChatId === session.id ? (
                <View style={styles.sidebarMenuCard}>
                  <AnimatedPressable style={styles.pressableReset} onPress={() => openRename(session)}>
                    <View style={styles.sidebarMenuItem}>
                      <Text style={styles.sidebarMenuText}>Rename</Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.pressableReset}
                    onPress={() => {
                      onPinChat?.(session.id, !session.pinned);
                      setMenuChatId("");
                    }}
                  >
                    <View style={styles.sidebarMenuItem}>
                      <Text style={styles.sidebarMenuText}>{session.pinned ? "Unpin chat" : "Pin chat"}</Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.pressableReset}
                    onPress={() => {
                      if (session.archived) onUnarchiveChat?.(session.id);
                      else onArchiveChat?.(session.id);
                      setMenuChatId("");
                    }}
                  >
                    <View style={styles.sidebarMenuItem}>
                      <Text style={styles.sidebarMenuText}>{session.archived ? "Unarchive" : "Archive"}</Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.pressableReset}
                    onPress={() => {
                      onDeleteChat?.(session.id);
                      setMenuChatId("");
                    }}
                  >
                    <View style={[styles.sidebarMenuItem, styles.sidebarMenuItemDanger]}>
                      <Text style={styles.sidebarMenuTextDanger}>Delete</Text>
                    </View>
                  </AnimatedPressable>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <AnimatedPressable style={styles.pressableReset} onPress={onOpenSettings}>
          <View style={styles.sidebarSettingsButton}>
            <Text style={styles.sidebarSettingsButtonText}>Settings</Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default Sidebar;
