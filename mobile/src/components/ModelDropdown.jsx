import { Animated, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { styles } from "../appStyles";
import AnimatedPressable from "./AnimatedPressable";

function ModelDropdown({
  models,
  selectedModel,
  open,
  onToggle,
  onSelect,
  disabled = false,
  popup = false
}) {
  const popupAnim = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(popupAnim, {
      toValue: open ? 1 : 0,
      duration: 150,
      useNativeDriver: true
    }).start();
  }, [open, popupAnim]);

  return (
    <View style={[styles.modelDropdownWrap, popup && styles.modelDropdownWrapPopup]}>
      {!popup ? (
        <AnimatedPressable style={styles.pressableReset} onPress={onToggle} disabled={disabled}>
          <View style={[styles.modelDropdownButton, disabled && styles.modelDropdownButtonDisabled]}>
            <Text style={styles.modelDropdownValue} numberOfLines={1}>
              {selectedModel || (models.length ? "Select model" : "No model")}
            </Text>
            <Text style={styles.modelDropdownCaret}>{open ? "▴" : "▾"}</Text>
          </View>
        </AnimatedPressable>
      ) : null}

      {open ? (
        <Animated.View
          style={[
            styles.modelDropdownMenu,
            popup && styles.modelDropdownMenuPopup,
            {
              opacity: popupAnim,
              transform: [
                {
                  translateY: popupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0]
                  })
                },
                {
                  scale: popupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1]
                  })
                }
              ]
            }
          ]}
        >
          {models.map((model) => {
            const active = model === selectedModel;

            return (
              <AnimatedPressable
                key={model}
                style={styles.pressableReset}
                onPress={() => onSelect(model)}
              >
                <View style={[styles.modelDropdownItem, active && styles.modelDropdownItemActive]}>
                  <View style={styles.modelDropdownItemCopy}>
                    <Text style={[styles.modelDropdownItemTitle, active && styles.modelDropdownItemTitleActive]}>
                      {model}
                    </Text>
                    <Text style={styles.modelDropdownItemHint}>
                      {active ? "Active model" : "Tap to switch"}
                    </Text>
                  </View>
                  {active ? <Text style={styles.modelDropdownCheck}>✓</Text> : null}
                </View>
              </AnimatedPressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

export default ModelDropdown;
