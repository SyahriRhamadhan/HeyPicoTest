import { Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { styles } from "../styles/appStyles";

function OptionPicker({ value, options, onChange, placeholder, disabled = false, compact = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const handleSelect = (nextValue) => {
    setOpen(false);
    onChange?.(nextValue);
  };

  return (
    <View style={styles.optionPickerWrap}>
      <Pressable
        style={[
          styles.optionPickerButton,
          compact && styles.optionPickerButtonCompact,
          disabled && styles.optionPickerButtonDisabled
        ]}
        onPress={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        disabled={disabled}
      >
        <Text style={styles.optionPickerButtonText}>{selected?.label || placeholder}</Text>
      </Pressable>

      {open ? (
        <View style={styles.optionPickerMenu}>
          <ScrollView nestedScrollEnabled style={styles.optionPickerScroll}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.optionPickerItem,
                  option.value === value && styles.optionPickerItemActive
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionPickerItemText,
                    option.value === value && styles.optionPickerItemTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default OptionPicker;
