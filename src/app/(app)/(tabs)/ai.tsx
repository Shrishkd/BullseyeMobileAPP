import { Brain, MessageSquare, Swords } from 'lucide-react-native';

import { NavCard } from '@/components/NavCard';
import { Disclaimer, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

export default function AiHubScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <Text variant="small" tone="muted">
        Machine-learning forecasts, a Bull vs Bear agent debate, and an assistant for Indian markets.
      </Text>
      <NavCard
        href="/predict"
        title="AI Predictions"
        description="UP / SIDEWAYS / DOWN with confidence, expected move and signals (XGBoost or LSTM)."
        icon={<Brain color={colors.primary} size={22} />}
      />
      <NavCard
        href="/debate"
        title="AI Debate"
        description="Bull and Bear agents argue from shared evidence; the verdict is computed by a fixed formula."
        icon={<Swords color={colors.warning} size={22} />}
        tint={colors.warningSoft}
      />
      <NavCard
        href="/chat"
        title="AI Chat"
        description="Ask about stocks, indicators, valuation ratios or your portfolio."
        icon={<MessageSquare color={colors.info} size={22} />}
        tint={colors.infoSoft}
      />
      <Disclaimer />
    </Screen>
  );
}
