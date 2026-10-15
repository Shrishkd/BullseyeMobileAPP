import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { Text } from './Text';

/**
 * Minimal Markdown renderer for Gemini output (headings, bullets, numbered
 * lists, **bold**). Deliberately small: AI text is untrusted, so links and
 * HTML are rendered as plain text, never executed or auto-opened.
 */
export function Markdown({ children }: { children: string }) {
  const lines = children.replace(/\r\n/g, '\n').split('\n');

  return (
    <View style={styles.wrap}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={styles.gap} />;

        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
          return (
            <Text key={i} variant={heading[1].length <= 2 ? 'title' : 'body'} weight="700" style={styles.heading}>
              {stripInline(heading[2])}
            </Text>
          );
        }

        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        if (bullet || numbered) {
          return (
            <View key={i} style={styles.listRow}>
              <Text variant="body" tone="muted" style={styles.marker}>
                {bullet ? '•' : `${numbered![1]}.`}
              </Text>
              <Text variant="body" style={styles.flex}>
                <Inline text={bullet ? bullet[1] : numbered![2]} />
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} variant="body">
            <Inline text={line} />
          </Text>
        );
      })}
    </View>
  );
}

function stripInline(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
}

/** Renders **bold** segments; everything else is plain text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} variant="body" weight="700">
            {p.slice(2, -2)}
          </Text>
        ) : (
          p.replace(/(^|\s)\*(\S[^*]*)\*/g, '$1$2')
        ),
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  gap: { height: spacing.sm },
  heading: { marginTop: spacing.xs },
  listRow: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  marker: { minWidth: 14 },
  flex: { flex: 1 },
});
