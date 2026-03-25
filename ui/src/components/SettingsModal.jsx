import { Pressable, Text, View } from "react-native";
import { FiTrash2, FiX } from "react-icons/fi";
import { styles } from "../styles/appStyles";

function SettingsModal({ onClose, onClearCurrent, onClearAll, canClearCurrent }) {
  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Memory Settings</Text>
        <Text style={styles.modalDescription}>Manage saved chat memory in SQLite.</Text>
        <Pressable
          style={[styles.modalButton, !canClearCurrent && styles.modalButtonDisabled]}
          onPress={onClearCurrent}
          disabled={!canClearCurrent}
          title="Clear current chat"
          accessibilityLabel="Clear current chat"
        >
          <View style={styles.modalButtonRow}>
            <FiTrash2 size={15} color="#ececec" />
            <Text style={styles.modalButtonText}>Clear current chat</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.modalButton, styles.modalDangerButton]}
          onPress={onClearAll}
          title="Clear all memory"
          accessibilityLabel="Clear all memory"
        >
          <View style={styles.modalButtonRow}>
            <FiTrash2 size={15} color="#ffb4b4" />
            <Text style={[styles.modalButtonText, styles.modalDangerButtonText]}>Clear all memory</Text>
          </View>
        </Pressable>
        <Pressable style={styles.modalCloseButton} onPress={onClose} title="Close" accessibilityLabel="Close">
          <FiX size={15} color="#bcbcbc" />
        </Pressable>
      </View>
    </View>
  );
}

export default SettingsModal;
