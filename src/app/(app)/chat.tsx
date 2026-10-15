import { Bot, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChat } from '@/api/queries';
import { Chip, ChipRow, errorText, Markdown, Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Message = { id: string; role: 'user' | 'assistant' | 'error'; text: string; at: number };

const QUICK_PROMPTS = [
  'Analyze TCS stock',
  'Summarize market trends',
  'Explain portfolio volatility',
  'Explain P/E and P/B ratios',
];

let seq = 0;
function makeMessage(role: Message['role'], text: string): Message {
  seq += 1;
  return { id: `${role}-${seq}`, role, text, at: Date.now() };
}

const WELCOME = makeMessage(
  'assistant',
  "Hi! I'm your Bullseye AI assistant. Ask me about stocks, market trends, indicators or your portfolio.",
);

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const chat = useChat();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const send = (raw: string) => {
    const question = raw.trim();
    if (!question || chat.isPending) return;
    setInput('');
    setMessages((m) => [...m, makeMessage('user', question)]);
    chat.mutate(question, {
      onSuccess: (r) => setMessages((m) => [...m, makeMessage('assistant', r.answer)]),
      onError: (e) => setMessages((m) => [...m, makeMessage('error', errorText(e))]),
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <Bubble message={item} />}
        ListFooterComponent={
          chat.isPending ? (
            <View style={styles.typing}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text variant="caption" tone="muted">
                Thinking…
              </Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.sm }]}>
        {messages.length <= 1 ? (
          <ChipRow>
            {QUICK_PROMPTS.map((p) => (
              <Chip key={p} label={p} onPress={() => send(p)} />
            ))}
          </ChipRow>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about stocks, trends, your portfolio…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
            style={[styles.input, { backgroundColor: colors.muted, color: colors.text, borderColor: colors.border }]}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || chat.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[styles.send, { backgroundColor: colors.primary, opacity: !input.trim() || chat.isPending ? 0.5 : 1 }]}>
            <Send color={colors.primaryText} size={18} />
          </Pressable>
        </View>
        <Text variant="caption" tone="muted" align="center">
          AI answers can be wrong. Not investment advice.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: Message }) {
  const { colors } = useTheme();
  const mine = message.role === 'user';
  const time = new Date(message.at);
  const stamp = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  return (
    <View style={[styles.bubbleRow, mine && styles.mine]}>
      {!mine ? (
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Bot color={colors.primary} size={16} />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.primary }
            : { backgroundColor: message.role === 'error' ? colors.downSoft : colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
        ]}>
        {mine ? (
          <Text variant="body" tone="onPrimary">
            {message.text}
          </Text>
        ) : message.role === 'error' ? (
          <Text variant="body" tone="down">
            {message.text}
          </Text>
        ) : (
          <Markdown>{message.text}</Markdown>
        )}
        <Text variant="caption" tone={mine ? 'onPrimary' : 'muted'} style={styles.stamp}>
          {stamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  bubbleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  mine: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  stamp: { alignSelf: 'flex-end', opacity: 0.7 },
});
