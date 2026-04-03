import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  pressableReset: {},
  pressableGrow: {
    flex: 1
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#1f1f1f"
  },
  keyboardAvoid: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 12
  },
  chatPanel: {
    flex: 1,
    position: "relative"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2b2b2b"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerBadgeWrap: {
    position: "relative",
    zIndex: 20
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2b2b2b",
    alignItems: "center",
    justifyContent: "center"
  },
  headerIconText: {
    color: "#f4f4f4",
    fontSize: 16,
    fontWeight: "700"
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#333333",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  headerBadgeText: {
    color: "#f4f4f4",
    fontSize: 14,
    fontWeight: "700"
  },
  headerBadgeCaret: {
    color: "#a9a9a9",
    fontSize: 12
  },
  subtleText: {
    color: "#b7b7b7",
    fontSize: 13
  },
  topMetaRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10
  },
  metaChip: {
    flex: 1,
    backgroundColor: "#262626",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 64
  },
  metaChipLabel: {
    color: "#9d9d9d",
    fontSize: 11,
    marginBottom: 4
  },
  metaChipValue: {
    color: "#f1f1f1",
    fontSize: 12
  },
  modelDropdownWrap: {
    marginTop: 6
  },
  modelDropdownWrapPopup: {
    position: "absolute",
    top: 42,
    left: 0,
    marginTop: 0,
    minWidth: 230
  },
  modelDropdownButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#1b1b1b",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modelDropdownButtonDisabled: {
    opacity: 0.5
  },
  modelDropdownValue: {
    flex: 1,
    color: "#f1f1f1",
    fontSize: 13,
    fontWeight: "600",
    paddingRight: 8
  },
  modelDropdownCaret: {
    color: "#b9b9b9",
    fontSize: 12
  },
  modelDropdownMenu: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#343230",
    overflow: "hidden"
  },
  modelDropdownMenuPopup: {
    marginTop: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  modelDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modelDropdownItemActive: {
    backgroundColor: "#3b3937"
  },
  modelDropdownItemCopy: {
    flex: 1,
    paddingRight: 8
  },
  modelDropdownItemTitle: {
    color: "#f1f1f1",
    fontSize: 15,
    fontWeight: "600"
  },
  modelDropdownItemTitleActive: {
    color: "#ffffff"
  },
  modelDropdownItemHint: {
    color: "#b8b0a9",
    fontSize: 12,
    marginTop: 2
  },
  modelDropdownCheck: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  locationPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: "#2a3c2f",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  locationPillText: {
    color: "#bde5c8",
    fontSize: 12
  },
  chatScroll: {
    flex: 1,
    marginTop: 10
  },
  quickActionsScroll: {
    marginBottom: 14
  },
  quickActionsContent: {
    gap: 8,
    paddingRight: 10
  },
  quickActionChip: {
    backgroundColor: "#2a2a2a",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  quickActionText: {
    color: "#d8d8d8",
    fontSize: 12
  },
  chatContent: {
    gap: 10,
    paddingBottom: 132
  },
  messageRow: {
    width: "100%"
  },
  messageBubbleWrap: {
    maxWidth: "92%"
  },
  messageRowUser: {
    alignItems: "flex-end"
  },
  messageRowAssistant: {
    alignItems: "flex-start"
  },
  messageBubble: {
    maxWidth: "92%",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  messageBubbleUser: {
    backgroundColor: "#3a3a3a"
  },
  messageBubbleAssistant: {
    backgroundColor: "transparent"
  },
  messageText: {
    color: "#f1f1f1",
    fontSize: 15,
    lineHeight: 21
  },
  metaText: {
    color: "#9a9a9a",
    fontSize: 11,
    marginTop: 6
  },
  messageActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6
  },
  messageActionsUser: {
    justifyContent: "flex-end"
  },
  messageActionsAssistant: {
    justifyContent: "flex-start"
  },
  messageActionChip: {
    backgroundColor: "#2f2f2f",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  messageActionChipText: {
    color: "#d5d5d5",
    fontSize: 11,
    fontWeight: "600"
  },
  loadingRow: {
    paddingVertical: 8,
    alignItems: "flex-start"
  },
  inputHint: {
    color: "#f59e0b",
    fontSize: 12,
    marginBottom: 6,
    paddingHorizontal: 8
  },
  composerShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent"
  },
  composerCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#2f2f2f",
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  composerPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#474747",
    alignItems: "center",
    justifyContent: "center"
  },
  composerPlusText: {
    color: "#f1f1f1",
    fontSize: 22,
    lineHeight: 22
  },
  composerMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#474747",
    alignItems: "center",
    justifyContent: "center"
  },
  composerMicText: {
    color: "#f1f1f1",
    fontSize: 14
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    color: "#f1f1f1",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 16
  },
  recommendationCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2d2d2d",
    borderRadius: 20,
    backgroundColor: "#242424",
    padding: 12,
    gap: 10
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  recommendationTitle: {
    color: "#f1f1f1",
    fontSize: 15,
    fontWeight: "700"
  },
  mapActions: {
    flexDirection: "row",
    gap: 8
  },
  secondaryButton: {
    backgroundColor: "#343434",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  secondaryButtonText: {
    color: "#f1f1f1",
    fontWeight: "600",
    fontSize: 12
  },
  pickerWrap: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1b1b1b"
  },
  picker: {
    color: "#e6edf6"
  },
  placeCard: {
    borderRadius: 14,
    backgroundColor: "#1b1b1b",
    padding: 12,
    gap: 4
  },
  placeTitle: {
    color: "#f3f3f3",
    fontWeight: "700",
    fontSize: 15
  },
  map: {
    width: "100%",
    height: 260,
    borderRadius: 14
  },
  inlineMapDisabled: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#1b1b1b"
  },
  bottomSpacer: {
    height: 18
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "82%",
    maxWidth: 320,
    backgroundColor: "#171717",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    borderRightWidth: 1,
    borderRightColor: "#2b2b2b"
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sidebarBrand: {
    color: "#f5f5f5",
    fontSize: 20,
    fontWeight: "700"
  },
  sidebarCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center"
  },
  sidebarCloseText: {
    color: "#d9d9d9",
    fontSize: 18
  },
  sidebarPrimaryButton: {
    borderRadius: 12,
    backgroundColor: "#2b2b2b",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12
  },
  sidebarPrimaryButtonText: {
    color: "#f1f1f1",
    fontWeight: "700"
  },
  sidebarTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  sidebarTab: {
    width: "100%",
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#232323",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  sidebarTabActive: {
    backgroundColor: "#333333"
  },
  sidebarTabText: {
    color: "#d7dde7",
    fontSize: 13,
    fontWeight: "700",
    includeFontPadding: false
  },
  sidebarTabTextActive: {
    color: "#ffffff"
  },
  sidebarScroll: {
    flex: 1
  },
  sidebarList: {
    gap: 8,
    paddingBottom: 12
  },
  sidebarEmptyText: {
    color: "#8f96a3",
    fontSize: 12
  },
  sidebarItemWrap: {
    gap: 6
  },
  sidebarItem: {
    borderRadius: 12,
    backgroundColor: "#232323",
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  sidebarItemActive: {
    backgroundColor: "#313131"
  },
  sidebarItemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sidebarItemText: {
    flex: 1,
    color: "#ececec",
    fontSize: 13
  },
  sidebarPin: {
    color: "#9dc1ff",
    fontSize: 12
  },
  sidebarMenuButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1b1b1b"
  },
  sidebarMenuButtonText: {
    color: "#b7c0cf",
    fontSize: 14
  },
  sidebarMenuCard: {
    borderRadius: 10,
    backgroundColor: "#242424",
    overflow: "hidden"
  },
  sidebarMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sidebarMenuText: {
    color: "#ececec",
    fontSize: 13
  },
  sidebarMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: "#343434"
  },
  sidebarMenuTextDanger: {
    color: "#ff9d9d",
    fontSize: 13
  },
  sidebarRenameCard: {
    borderRadius: 12,
    backgroundColor: "#242424",
    padding: 10,
    gap: 8
  },
  sidebarRenameInput: {
    borderRadius: 10,
    backgroundColor: "#171717",
    color: "#ececec",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  sidebarRenameActions: {
    flexDirection: "row",
    gap: 8
  },
  sidebarRenameButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#303030",
    paddingVertical: 8,
    alignItems: "center"
  },
  sidebarRenameButtonText: {
    color: "#ececec",
    fontSize: 12,
    fontWeight: "600"
  },
  sidebarSettingsButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#242424",
    paddingVertical: 12,
    alignItems: "center"
  },
  sidebarSettingsButtonText: {
    color: "#ececec",
    fontWeight: "600"
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center"
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)"
  },
  modalCard: {
    width: "86%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: "#1d1d1d",
    padding: 16,
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
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    alignItems: "center"
  },
  modalButtonDisabled: {
    opacity: 0.5
  },
  modalButtonText: {
    color: "#ececec",
    fontWeight: "600"
  },
  modalDangerButton: {
    backgroundColor: "#3b1e1e"
  },
  modalDangerButtonText: {
    color: "#ffb4b4"
  },
  modalCloseButton: {
    marginTop: 4,
    alignItems: "center"
  },
  modalCloseButtonText: {
    color: "#b9c2d0",
    fontSize: 13
  }
});
