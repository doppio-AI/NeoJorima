import React, { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { COLORS, SIZES, FONTS } from "@/constants/theme";

export default function ThemedInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor={COLORS.textSecondary}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    color: COLORS.text,
    ...FONTS.body,
  },
  inputFocused: {
    borderWidth: 4,
    borderColor: COLORS.secondary,
  },
});
