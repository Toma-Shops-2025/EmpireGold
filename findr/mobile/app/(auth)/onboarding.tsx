import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/constants/theme';

function isAdult(dobIso: string): boolean {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age >= 18;
}

/**
 * Age gate + legal acceptances stub.
 * TODO: wire real auth vendor (Clerk / Supabase Auth / Firebase Auth).
 */
export default function OnboardingScreen() {
  const [dob, setDob] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueToApp = () => {
    if (!accepted) {
      setError('Please accept the Terms and Privacy Policy.');
      return;
    }
    if (!isAdult(dob)) {
      setError('Findr is for adults 18+. Enter a valid date of birth (YYYY-MM-DD).');
      return;
    }
    setError(null);
    router.replace('/(tabs)/nearby');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.heroGlow} />
      <View style={styles.content}>
        <Text style={styles.brand}>Findr</Text>
        <Text style={styles.headline}>Meet people nearby — on your terms.</Text>
        <Text style={styles.support}>
          Inclusive dating and hookups for adults of every orientation. Confirm you
          are 18+ to continue.
        </Text>

        <Text style={styles.label}>Date of birth</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mistMuted}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />

        <Pressable
          onPress={() => setAccepted((v) => !v)}
          style={styles.checkRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxOn]} />
          <Text style={styles.checkText}>
            I am 18+ and accept the Terms of Service and Privacy Policy.
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.cta} onPress={continueToApp}>
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.coral,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
  },
  brand: {
    fontFamily: typography.brand,
    fontSize: 48,
    color: colors.mist,
    letterSpacing: -1,
  },
  headline: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.mist,
    lineHeight: 28,
  },
  support: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.mistMuted,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.mistMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inkElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.mist,
    fontFamily: typography.body,
    fontSize: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  checkText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.mist,
    lineHeight: 20,
  },
  error: {
    fontFamily: typography.body,
    color: colors.danger,
    fontSize: 14,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: typography.heading,
    color: colors.ink,
    fontSize: 16,
  },
});
