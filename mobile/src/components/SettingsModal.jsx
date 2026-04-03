import { Pressable, Text, View } from "react-native";
import { styles } from "../appStyles";

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
        >
          <Text style={styles.modalButtonText}>Clear current chat</Text>
        </Pressable>

        <Pressable style={[styles.modalButton, styles.modalDangerButton]} onPress={onClearAll}>
          <Text style={[styles.modalButtonText, styles.modalDangerButtonText]}>Clear all memory</Text>
        </Pressable>

        <Pressable style={styles.modalCloseButton} onPress={onClose}>
          <Text style={styles.modalCloseButtonText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default SettingsModal;
