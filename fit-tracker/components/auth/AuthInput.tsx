import { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Fonts, GlassStyle, IconStroke } from '@/constants/theme';

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  function AuthInput({ label, error, isPassword, ...inputProps }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor="rgba(255,255,255,0.25)"
            selectionColor={Colors.primary}
            secureTextEntry={isPassword && !showPassword}
            {...inputProps}
          />
          {isPassword && (
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              hitSlop={12}
            >
              {showPassword ? (
                <EyeOff size={20} color="rgba(255,255,255,0.4)" strokeWidth={IconStroke.default} />
              ) : (
                <Eye size={20} color="rgba(255,255,255,0.4)" strokeWidth={IconStroke.default} />
              )}
            </Pressable>
          )}
        </View>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassStyle.card,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: 'rgba(239,68,68,0.4)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    height: '100%',
  },
  eyeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
