import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";

function Sidebar() {
  const historyItems = ["Map Search", "Nearby Laundry", "Current Location"];

  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarBrand}>HeyPico</Text>
      <Pressable style={styles.newChatButton}>
        <Text style={styles.newChatButtonText}>+ New chat</Text>
      </Pressable>
      <View style={styles.historyList}>
        {historyItems.map((item, index) => (
          <Text key={`${item}-${index}`} style={styles.historyItem}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default Sidebar;

