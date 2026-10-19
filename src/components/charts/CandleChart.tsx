import { memo, useMemo, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { Candle } from '@/api/types';
import { Text } from '@/components/ui';
import { formatNumber, formatVolume } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type CandleChartProps = {
  candles: Candle[];
  height?: number;
  /** Live LTP drawn as a dashed line over the last candle. */
  livePrice?: number | null;
  showRsi?: boolean;
  daily?: boolean;
};

const AXIS_W = 56;
const RSI_H = 64;
const MIN_CANDLE_SPACING = 6;

/**
 * Lightweight SVG candlestick chart (no WebView). Shows the most recent
 * candles that fit the width, the EMA overlay computed by the backend, and an
 * optional RSI panel. Touch and drag to inspect a candle.
 */
export const CandleChart = memo(function CandleChart({
  candles,
  height = 240,
  livePrice,
  showRsi = true,
  daily,
}: CandleChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const plotW = Math.max(width - AXIS_W, 0);
  const maxCount = Math.max(Math.floor(plotW / MIN_CANDLE_SPACING), 10);
  const visible = useMemo(() => candles.slice(-maxCount), [candles, maxCount]);

  const geom = useMemo(() => {
    if (visible.length === 0 || plotW === 0) return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of visible) {
      lo = Math.min(lo, c.low, c.ema ?? Infinity);
      hi = Math.max(hi, c.high, c.ema ?? -Infinity);
    }
    if (livePrice) {
      lo = Math.min(lo, livePrice);
      hi = Math.max(hi, livePrice);
    }
    const pad = (hi - lo) * 0.06 || hi * 0.01 || 1;
    lo -= pad;
    hi += pad;
    const step = plotW / visible.length;
    const y = (v: number) => ((hi - v) / (hi - lo)) * height;
    const x = (i: number) => i * step + step / 2;
    return { lo, hi, step, x, y };
  }, [visible, plotW, height, livePrice]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const pick = (e: GestureResponderEvent) => {
    if (!geom) return;
    const idx = Math.floor(e.nativeEvent.locationX / geom.step);
    setActiveIdx(Math.max(0, Math.min(visible.length - 1, idx)));
  };

  const active = activeIdx !== null ? visible[activeIdx] : visible[visible.length - 1];
  const totalH = height + (showRsi ? RSI_H + spacing.sm : 0);

  return (
    <View style={styles.wrap}>
      {active ? (
        <View style={styles.readout}>
          <Text variant="caption" tone="muted">
            {formatTime(active.time, daily)}
          </Text>
          <Text variant="caption" numeric>
            O {formatNumber(active.open)} H {formatNumber(active.high)} L {formatNumber(active.low)} C{' '}
            {formatNumber(active.close)}
          </Text>
          {active.volume != null ? (
            <Text variant="caption" tone="muted" numeric>
              Vol {formatVolume(active.volume)}
            </Text>
          ) : null}
          {active.rsi != null ? (
            <Text variant="caption" tone="muted" numeric>
              RSI {active.rsi.toFixed(1)}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        onLayout={onLayout}
        style={{ height: totalH }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderRelease={() => setActiveIdx(null)}
        onResponderTerminate={() => setActiveIdx(null)}
        accessible
        accessibilityLabel={
          active ? `Candlestick chart. Latest close ${formatNumber(active.close)} rupees.` : 'Candlestick chart'
        }>
        {geom && width > 0 ? (
          <Svg width={width} height={totalH}>
            {/* Grid + price axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const v = geom.hi - (geom.hi - geom.lo) * t;
              const yy = geom.y(v);
              return (
                <Line key={`g${t}`} x1={0} x2={plotW} y1={yy} y2={yy} stroke={colors.border} strokeWidth={0.5} />
              );
            })}
            {[0.05, 0.5, 0.95].map((t) => {
              const v = geom.hi - (geom.hi - geom.lo) * t;
              return (
                <SvgText
                  key={`l${t}`}
                  x={plotW + 6}
                  y={geom.y(v) + 4}
                  fill={colors.textMuted}
                  fontSize={10}>
                  {formatNumber(v, v >= 1000 ? 0 : 2)}
                </SvgText>
              );
            })}

            {/* Candles */}
            {visible.map((c, i) => {
              const up = c.close >= c.open;
              const color = up ? colors.up : colors.down;
              const bodyTop = geom.y(Math.max(c.open, c.close));
              const bodyH = Math.max(Math.abs(geom.y(c.open) - geom.y(c.close)), 1);
              const bw = Math.max(geom.step * 0.62, 1.5);
              return (
                <CandleMark
                  key={c.time}
                  x={geom.x(i)}
                  bw={bw}
                  top={bodyTop}
                  h={bodyH}
                  wickTop={geom.y(c.high)}
                  wickBottom={geom.y(c.low)}
                  color={color}
                />
              );
            })}

            {/* EMA overlay */}
            <Polyline
              points={visible
                .map((c, i) => (c.ema != null ? `${geom.x(i).toFixed(1)},${geom.y(c.ema).toFixed(1)}` : null))
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke={colors.warning}
              strokeWidth={1.25}
            />

            {/* Live price */}
            {livePrice ? (
              <Line
                x1={0}
                x2={plotW}
                y1={geom.y(livePrice)}
                y2={geom.y(livePrice)}
                stroke={colors.primary}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            ) : null}

            {/* Crosshair */}
            {activeIdx !== null ? (
              <Line
                x1={geom.x(activeIdx)}
                x2={geom.x(activeIdx)}
                y1={0}
                y2={totalH}
                stroke={colors.textMuted}
                strokeWidth={0.75}
              />
            ) : null}

            {/* RSI panel */}
            {showRsi ? (
              <RsiPanel
                candles={visible}
                top={height + spacing.sm}
                width={plotW}
                x={geom.x}
                colors={{ line: colors.info, guide: colors.border, label: colors.textMuted }}
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
    </View>
  );
});

function CandleMark(p: { x: number; bw: number; top: number; h: number; wickTop: number; wickBottom: number; color: string }) {
  return (
    <>
      <Line x1={p.x} x2={p.x} y1={p.wickTop} y2={p.wickBottom} stroke={p.color} strokeWidth={1} />
      <Rect x={p.x - p.bw / 2} y={p.top} width={p.bw} height={p.h} fill={p.color} />
    </>
  );
}

function RsiPanel({
  candles,
  top,
  width,
  x,
  colors,
}: {
  candles: Candle[];
  top: number;
  width: number;
  x: (i: number) => number;
  colors: { line: string; guide: string; label: string };
}) {
  const y = (v: number) => top + ((100 - v) / 100) * RSI_H;
  const points = candles
    .map((c, i) => (c.rsi != null ? `${x(i).toFixed(1)},${y(c.rsi).toFixed(1)}` : null))
    .filter(Boolean)
    .join(' ');
  return (
    <>
      {[70, 30].map((lvl) => (
        <Line key={lvl} x1={0} x2={width} y1={y(lvl)} y2={y(lvl)} stroke={colors.guide} strokeDasharray="3 3" />
      ))}
      <SvgText x={width + 6} y={y(70) + 4} fill={colors.label} fontSize={10}>
        70
      </SvgText>
      <SvgText x={width + 6} y={y(30) + 4} fill={colors.label} fontSize={10}>
        30
      </SvgText>
      {points ? <Polyline points={points} fill="none" stroke={colors.line} strokeWidth={1.25} /> : null}
    </>
  );
}

function formatTime(ms: number, daily?: boolean) {
  const d = new Date(ms);
  const date = d.toDateString().slice(4, 10);
  if (daily) return `${date} ${d.getFullYear()}`;
  return `${date}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  readout: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 2 },
});
