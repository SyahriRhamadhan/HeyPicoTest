import { Text, View } from "react-native";
import { styles } from "../appStyles";
import AnimatedPressable from "./AnimatedPressable";
import ModelDropdown from "./ModelDropdown";

function AppHeader({
  onUseLocation,
  onToggleSidebar,
  onOpenSettings,
  onToggleRecommendations,
  title = "MapAi",
  models = [],
  selectedModel = "",
  isModelMenuOpen = false,
  onToggleModelMenu,
  onSelectModel,
  modelDisabled = false
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <AnimatedPressable style={styles.pressableReset} onPress={onToggleSidebar}>
          <View style={styles.headerIconButton}>
            <Text style={styles.headerIconText}>≡</Text>
          </View>
        </AnimatedPressable>

        <View style={styles.headerBadgeWrap}>
          <AnimatedPressable style={styles.pressableReset} onPress={onToggleModelMenu} disabled={modelDisabled}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{title}</Text>
              <Text style={styles.headerBadgeCaret}>⌄</Text>
            </View>
          </AnimatedPressable>

          <ModelDropdown
            models={models}
            selectedModel={selectedModel}
            open={isModelMenuOpen}
            disabled={modelDisabled}
            onToggle={onToggleModelMenu}
            onSelect={onSelectModel}
            popup
          />
        </View>
      </View>

      <View style={styles.headerRight}>
        <AnimatedPressable style={styles.pressableReset} onPress={onUseLocation}>
          <View style={styles.headerIconButton}>
            <Text style={styles.headerIconText}>◎</Text>
          </View>
        </AnimatedPressable>
        <AnimatedPressable style={styles.pressableReset} onPress={onToggleRecommendations}>
          <View style={styles.headerIconButton}>
            <Text style={styles.headerIconText}>⌖</Text>
          </View>
        </AnimatedPressable>
        <AnimatedPressable style={styles.pressableReset} onPress={onOpenSettings}>
          <View style={styles.headerIconButton}>
            <Text style={styles.headerIconText}>⋯</Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default AppHeader;
