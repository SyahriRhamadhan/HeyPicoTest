import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  layout: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#1f1f1f",
    flexDirection: "row",
    color: "#ececec"
  },
  sidebar: {
    width: 260,
    backgroundColor: "#171717",
    borderRightWidth: 1,
    borderColor: "#2b2b2b",
    padding: 14,
    gap: 12
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
    color: "#b0b0b0",
    backgroundColor: "#202020",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    justifyContent: "space-between"
  },
  mapPanel: {
    width: 360,
    margin: 16,
    marginLeft: 0,
    height: "calc(100vh - 32px)"
  },
  panelHeader: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderColor: "#2e2e2e"
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
    marginHorizontal: "auto",
    marginBottom: 18,
    width: "min(860px, calc(100% - 44px))",
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
    padding: 12,
    gap: 10
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
    minHeight: 320,
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
