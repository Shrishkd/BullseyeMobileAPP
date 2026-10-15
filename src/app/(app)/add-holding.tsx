import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useAddHolding } from '@/api/queries';
import type { AssetType } from '@/api/types';
import { Button, errorText, Input, Screen, Segmented, Text } from '@/components/ui';
import { normaliseSymbol } from '@/lib/format';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Fund' },
  { value: 'crypto', label: 'Crypto' },
];

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parses a positive decimal typed with either '.' or ','. */
function parsePositive(raw: string): number | null {
  const n = Number(raw.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function AddHoldingScreen() {
  const params = useLocalSearchParams<{ symbol?: string; price?: string }>();
  const add = useAddHolding();

  const [symbol, setSymbol] = useState(params.symbol ?? '');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(params.price ? Number(params.price).toFixed(2) : '');
  const [date, setDate] = useState(todayISODate());
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const sym = normaliseSymbol(symbol);
    const qty = parsePositive(quantity);
    const buy = parsePositive(price);
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : null;

    if (!sym) return setError('Enter a symbol.');
    if (qty == null) return setError('Quantity must be a positive number.');
    if (buy == null) return setError('Buy price must be a positive number.');
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return setError('Use the date format YYYY-MM-DD.');
    if (parsedDate.getTime() > Date.now()) return setError('Buy date cannot be in the future.');

    setError(null);
    add.mutate(
      { symbol: sym, quantity: qty, buy_price: buy, buy_date: parsedDate.toISOString(), asset_type: assetType },
      { onSuccess: () => router.back(), onError: (e) => setError(errorText(e)) },
    );
  };

  return (
    <Screen keyboard>
      <Input
        label="Symbol"
        value={symbol}
        onChangeText={setSymbol}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="RELIANCE"
      />
      <Input label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="10" />
      <Input label="Buy price (₹)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="1450.00" />
      <Input
        label="Buy date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
      />
      <Text variant="small" tone="muted" weight="500">
        Asset type
      </Text>
      <Segmented options={ASSET_TYPES} value={assetType} onChange={setAssetType} />
      {error ? (
        <Text variant="small" tone="down">
          {error}
        </Text>
      ) : null}
      <Button title="Add to portfolio" loading={add.isPending} onPress={submit} />
    </Screen>
  );
}
