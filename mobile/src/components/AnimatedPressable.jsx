import { useRef } from "react";
import { Animated, Pressable } from "react-native";

function AnimatedPressable({ children, style, onPressIn, onPressOut, ...props }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event) => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();

    onPressOut?.(event);
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        style={{ width: "100%" }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default AnimatedPressable;
