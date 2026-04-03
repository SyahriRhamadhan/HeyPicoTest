import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import IconGlyph from "./IconGlyph";

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
            <IconGlyph name="trash" style={styles.iconGlyphLight} />
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
            <IconGlyph name="trash" style={styles.iconGlyphDanger} />
            <Text style={[styles.modalButtonText, styles.modalDangerButtonText]}>Clear all memory</Text>
          </View>
        </Pressable>

        <Pressable style={styles.modalCloseButton} onPress={onClose} title="Close" accessibilityLabel="Close">
          <IconGlyph name="close" style={styles.iconGlyphMuted} />
        </Pressable>
      </View>
    </View>
  );
}

export default SettingsModal;
