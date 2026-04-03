import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../appStyles";
import AnimatedPressable from "./AnimatedPressable";

function ComposerBar({ inputHint, prompt, onPromptChange, onSend, loading }) {
  const [inputHeight, setInputHeight] = useState(44);
  const insets = useSafeAreaInsets();

  const handleContentSizeChange = (event) => {
    const nextHeight = Number(event?.nativeEvent?.contentSize?.height || 44);
    const clampedHeight = Math.max(44, Math.min(nextHeight, 132));
    setInputHeight(clampedHeight);
  };

  const bottomOffset = Platform.OS === "android" ? 2 : Math.max(insets.bottom - 6, 6);

  return (
    <View style={[styles.composerShell, { paddingBottom: bottomOffset }]}>
      {inputHint ? <Text style={styles.inputHint}>{inputHint}</Text> : null}
      <View style={styles.composerCard}>
        <AnimatedPressable style={styles.pressableReset}>
          <View style={styles.composerPlus}>
            <Text style={styles.composerPlusText}>+</Text>
          </View>
        </AnimatedPressable>

        <TextInput
          style={[styles.input, { height: inputHeight }]}
          value={prompt}
          onChangeText={onPromptChange}
          onContentSizeChange={handleContentSizeChange}
          placeholder="Ask anything"
          placeholderTextColor="#8f8f8f"
          multiline
          scrollEnabled={inputHeight >= 132}
          textAlignVertical="top"
        />

        <AnimatedPressable style={styles.pressableReset}>
          <View style={styles.composerMic}>
            <Text style={styles.composerMicText}>◉</Text>
          </View>
        </AnimatedPressable>

        <AnimatedPressable style={styles.pressableReset} onPress={onSend} disabled={loading}>
          <View style={styles.sendButton}>
            <Text style={styles.sendButtonText}>{loading ? "..." : "↑"}</Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default ComposerBar;
