import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  layout: {
    height: "100vh",
    width: "100%",
    backgroundColor: "#1f1f1f",
    flexDirection: "row",
    color: "#ececec",
    overflow: "hidden"
  },
  sidebar: {
    width: 260,
    height: "100vh",
    backgroundColor: "#171717",
    borderRightWidth: 1,
    borderColor: "#2b2b2b",
    padding: 14,
    gap: 12,
    overflow: "auto"
  },
  sidebarCollapsed: {
    width: 64,
    height: "100vh",
    backgroundColor: "#171717",
    borderRightWidth: 1,
    borderColor: "#2b2b2b",
    padding: 10,
    alignItems: "center",
    overflow: "auto"
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sidebarToggleButton: {
    borderWidth: 1,
    borderColor: "#363636",
    backgroundColor: "#202020",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  sidebarToggleText: {
    color: "#d6d6d6",
    fontWeight: "700",
    fontSize: 12
  },
  sidebarBrand: {
    color: "#f5f5f5",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4
  },
  newChatButton: {
    borderWidth: 1,
    borderColor: "#363636",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#202020",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-start"
  },
  newChatButtonText: {
    color: "#ececec",
    fontWeight: "600"
  },
  historyList: {
    gap: 4
  },
  historyViewTabs: {
    flexDirection: "row",
    gap: 6
  },
  historyViewTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#363636",
    borderRadius: 10,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7
  },
  historyViewTabActive: {
    borderColor: "#4b4b4b",
    backgroundColor: "#2b2b2b"
  },
  historyViewTabText: {
    color: "#aeb6c3",
    fontSize: 12,
    fontWeight: "600"
  },
  historyViewTabTextActive: {
    color: "#ececec"
  },
  historyItemWrap: {
    gap: 4
  },
  historyEmptyText: {
    color: "#8f96a3",
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 2
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: 10
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: "#3b3b3b",
    borderRadius: 10,
    backgroundColor: "#202020",
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  settingsButtonText: {
    color: "#cfcfcf",
    fontSize: 13,
    fontWeight: "600"
  },
  historyItem: {
    backgroundColor: "#202020",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  historyItemEdit: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  historyItemActive: {
    backgroundColor: "#2b2b2b",
    borderWidth: 1,
    borderColor: "#3a3a3a"
  },
  historyMainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  historyMenuButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1d1d1d"
  },
  historyItemText: {
    color: "#b0b0b0",
    fontSize: 13,
    flex: 1
  },
  historyMenuCard: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#222222",
    borderRadius: 10,
    paddingVertical: 6
  },
  historyMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  historyMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
    marginTop: 4,
    paddingTop: 9
  },
  historyMenuText: {
    color: "#d8dee7",
    fontSize: 13
  },
  historyMenuTextDanger: {
    color: "#ff9d9d"
  },
  historyRenameInput: {
    color: "#ececec",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: "#1b1b1b"
  },
  historyEditActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  historyEditButton: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#222"
  },
  historyEditButtonText: {
    color: "#d8dee7",
    fontSize: 12,
    fontWeight: "600"
  },
  panel: {
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 14
  },
  chatPanel: {
    flex: 1,
    justifyContent: "space-between",
    height: "100vh",
    overflow: "hidden"
  },
  mapPanel: {
    width: 460,
    height: "100vh",
    borderRadius: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0
  },
  panelHeader: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderColor: "#2e2e2e"
  },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mapHeaderRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#2e2e2e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerChipButton: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#242424",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  iconButton: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#242424",
    borderRadius: 999,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  headerChipButtonText: {
    color: "#d6d6d6",
    fontSize: 12,
    fontWeight: "600"
  },
  panelHeaderText: {
    color: "#f0f0f0",
    fontWeight: "700",
    fontSize: 20
  },
  chatLog: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16
  },
  chatContent: {
    gap: 16,
    paddingBottom: 24
  },
  bubbleRow: {
    width: "100%"
  },
  userRow: {
    alignItems: "flex-end"
  },
  assistantRow: {
    alignItems: "flex-start"
  },
  bubble: {
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18
  },
  bubbleStack: {
    maxWidth: "80%"
  },
  userBubble: {
    backgroundColor: "#303030"
  },
  assistantBubble: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  bubbleText: {
    color: "#ececec",
    lineHeight: 22,
    fontSize: 17
  },
  bubbleMeta: {
    color: "#9f9f9f",
    fontSize: 12,
    marginTop: 8
  },
  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  messageActionsUser: {
    justifyContent: "flex-end"
  },
  messageActionsAssistant: {
    justifyContent: "flex-start"
  },
  messageActionButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#242424"
  },
  messageMapActionButton: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#242424",
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  messageMapActionText: {
    color: "#cfd8e3",
    fontSize: 12,
    fontWeight: "600"
  },
  inputBar: {
    borderTopWidth: 1,
    borderColor: "#2e2e2e",
    borderWidth: 1,
    backgroundColor: "#2b2b2b",
    borderRadius: 26,
    padding: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  composerWrap: {
    marginHorizontal: "auto",
    marginBottom: 18,
    width: "min(860px, calc(100% - 44px))",
    gap: 6
  },
  inputHintText: {
    color: "#f59e0b",
    fontSize: 12,
    paddingHorizontal: 6
  },
  promptInput: {
    flex: 1,
    color: "#ececec",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  iconActionButton: {
    backgroundColor: "#ececec",
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  locationButton: {
    backgroundColor: "#10a37f"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: { color: "#111", fontWeight: "700" },
  locationButtonText: { color: "#ffffff" },
  panelBody: {
    flex: 1,
    padding: 14,
    gap: 12,
    overflow: "auto"
  },
  placeCard: {
    borderWidth: 1,
    borderColor: "#353535",
    borderRadius: 10,
    backgroundColor: "#262626",
    padding: 10
  },
  placeTitle: {
    color: "#f2f2f2",
    fontWeight: "700"
  },
  placeAddress: {
    color: "#b0b0b0",
    marginTop: 5,
    fontSize: 13
  },
  linkInline: {
    color: "#7fc7ff",
    fontSize: 13,
    marginTop: 6,
    display: "inline-block"
  },
  mapFrame: {
    flex: 1,
    minHeight: 460,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#353535",
    overflow: "hidden"
  },
  mapFallback: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 12
  },
  mutedText: {
    color: "#9f9f9f",
    textAlign: "center"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    alignItems: "flex-start",
    justifyContent: "flex-end"
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)"
  },
  modalCard: {
    marginLeft: 12,
    marginBottom: 12,
    width: 300,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 12,
    backgroundColor: "#1d1d1d",
    padding: 14,
    gap: 10
  },
  modalTitle: {
    color: "#f1f1f1",
    fontSize: 16,
    fontWeight: "700"
  },
  modalDescription: {
    color: "#b8b8b8",
    fontSize: 13
  },
  modalButton: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 10,
    backgroundColor: "#242424",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  modalButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  modalButtonDisabled: {
    opacity: 0.5
  },
  modalButtonText: {
    color: "#ececec",
    fontWeight: "600"
  },
  modalDangerButton: {
    borderColor: "#5a2a2a",
    backgroundColor: "#2b1717"
  },
  modalDangerButtonText: {
    color: "#ffb4b4"
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center"
  },
  modalCloseButtonText: {
    color: "#bcbcbc"
  }
});
