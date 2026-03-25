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
    borderRadius: 9
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
    backgroundColor: "#202020"
  },
  newChatButtonText: {
    color: "#ececec",
    fontWeight: "600"
  },
  historyList: {
    gap: 4
  },
  historyItem: {
    backgroundColor: "#202020",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  historyItemActive: {
    backgroundColor: "#2b2b2b",
    borderWidth: 1,
    borderColor: "#3a3a3a"
  },
  historyItemText: {
    color: "#b0b0b0",
    fontSize: 13
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
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18
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
  button: {
    backgroundColor: "#ececec",
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 14
  },
  locationButton: {
    backgroundColor: "#10a37f"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#111",
    fontWeight: "700"
  },
  locationButtonText: {
    color: "#ffffff"
  },
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
  }
});
