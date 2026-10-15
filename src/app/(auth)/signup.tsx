import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button, errorText, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/stores/auth';
import { spacing } from '@/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setError(null);
    setBusy(true);
    try {
      await signup(email, password, name);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Track, analyse and understand your investments">
      <Input label="Full name (optional)" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
        error={error}
      />
      <Button title="Create account" loading={busy} onPress={submit} />
      <View style={styles.footer}>
        <Text variant="small" tone="muted">
          Already have an account?
        </Text>
        <Link href="/login" replace>
          <Text variant="small" tone="primary" weight="600">
            Sign in
          </Text>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
});
