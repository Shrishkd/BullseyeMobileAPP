import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useNews } from '@/api/queries';
import type { NewsArticle } from '@/api/types';
import { Badge, Card, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Only open http(s) links from the news feed (third-party data). */
function openArticle(url: string) {
  if (/^https?:\/\//i.test(url)) void WebBrowser.openBrowserAsync(url);
}

export default function NewsScreen() {
  const { colors } = useTheme();
  const news = useNews();

  if (news.isLoading) return <LoadingState message="Fetching market news…" />;
  if (news.error || !news.data) return <ErrorState error={news.error} onRetry={news.refetch} />;

  const ms = news.data.market_sentiment;
  const tone = ms.label === 'Bullish' ? 'up' : ms.label === 'Bearish' ? 'down' : 'default';

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={news.data.articles}
      keyExtractor={(a, i) => `${a.url}-${i}`}
      refreshing={news.isRefetching}
      onRefresh={news.refetch}
      ListHeaderComponent={
        <Card>
          <Text variant="label" tone="muted">
            Overall market sentiment
          </Text>
          <View style={styles.between}>
            <Text variant="heading" tone={tone}>
              {ms.label}
            </Text>
            <Text variant="title" tone={tone} numeric>
              {ms.score >= 0 ? '+' : ''}
              {ms.score.toFixed(2)}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            Average VADER score across {news.data.total} articles. Pull to refresh.
          </Text>
        </Card>
      }
      ListEmptyComponent={<EmptyState title="No news right now" />}
      renderItem={({ item }) => <ArticleCard article={item} />}
    />
  );
}

function ArticleCard({ article: a }: { article: NewsArticle }) {
  const { colors } = useTheme();
  const tone = a.sentiment.label === 'Positive' ? 'up' : a.sentiment.label === 'Negative' ? 'down' : 'neutral';
  return (
    <Pressable
      onPress={() => openArticle(a.url)}
      accessibilityRole="link"
      accessibilityLabel={`${a.title}. ${a.sentiment.label} sentiment. From ${a.source}.`}
      style={({ pressed }) => [styles.article, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
      <View style={styles.flex}>
        <Text variant="caption" tone="muted">
          {a.source} · {timeAgo(a.published_at.replace(' ', 'T'))}
        </Text>
        <Text variant="body" weight="600" numberOfLines={3}>
          {a.title}
        </Text>
        {a.description ? (
          <Text variant="small" tone="muted" numberOfLines={2}>
            {a.description}
          </Text>
        ) : null}
        <Badge label={`${a.sentiment.label} ${a.sentiment.score >= 0 ? '+' : ''}${a.sentiment.score.toFixed(2)}`} tone={tone} />
      </View>
      {a.image_url ? <Image source={{ uri: a.image_url }} style={styles.thumb} contentFit="cover" transition={150} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  article: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  flex: { flex: 1, gap: 4 },
});
