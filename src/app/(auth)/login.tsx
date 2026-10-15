import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button, errorText, Input, Text } from '@/components/ui';
import { DEMO_CREDENTIALS } from '@/config/env';
import { useAuthStore } from '@/stores/auth';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const notice = useAuthStore((s) => s.notice);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);

  const submit = async (creds: { email: string; password: string }, source: 'form' | 'demo') => {
    if (!creds.email.trim() || !creds.password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setBusy(source);
    try {
      await login(creds.email, creds.password);
      // Stack.Protected swaps to the app stack once status is signedIn.
    } catch (e) {
      setError(errorText(e));
      setBusy(null);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Bullseye account">
      {notice ? (
        <Text variant="small" tone="warning">
          {notice}
        </Text>
      ) : null}
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        placeholder="••••••••"
        onSubmitEditing={() => submit({ email, password }, 'form')}
        error={error}
      />
      <Button title="Sign in" loading={busy === 'form'} disabled={!!busy} onPress={() => submit({ email, password }, 'form')} />
      <Button
        title="Sign in with demo account"
        variant="secondary"
        loading={busy === 'demo'}
        disabled={!!busy}
        onPress={() => submit(DEMO_CREDENTIALS, 'demo')}
      />
      <View style={styles.footer}>
        <Text variant="small" tone="muted">
          New to Bullseye?
        </Text>
        <Link href="/signup" replace>
          <Text variant="small" tone="primary" weight="600">
            Create an account
          </Text>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
});
