import { formatINR, formatINRCompact, formatNumber, formatPct, formatVolume, normaliseSymbol, timeAgo } from '@/lib/format';

describe('format', () => {
  it('formats volume with Indian units', () => {
    expect(formatVolume(950)).toBe('950');
    expect(formatVolume(125000)).toBe('1.25L');
    expect(formatVolume(32_000_000)).toBe('3.20Cr');
    expect(formatVolume(4500)).toBe('4.5k');
    expect(formatVolume(null)).toBe('—');
  });
  it('uses Indian digit grouping', () => {
    expect(formatNumber(1234567.891)).toBe('12,34,567.89');
    expect(formatNumber(999)).toBe('999.00');
    expect(formatNumber(-100000, 0)).toBe('-1,00,000');
  });

  it('formats INR with sign before the symbol', () => {
    expect(formatINR(7526.95)).toBe('₹7,526.95');
    expect(formatINR(-1500)).toBe('-₹1,500.00');
    expect(formatINR(null)).toBe('—');
    expect(formatINR(Number.NaN)).toBe('—');
  });

  it('compacts lakhs and crores', () => {
    expect(formatINRCompact(250000)).toBe('₹2.50L');
    expect(formatINRCompact(32_000_000)).toBe('₹3.20Cr');
  });

  it('signs percentages', () => {
    expect(formatPct(1.456)).toBe('+1.46%');
    expect(formatPct(-0.4)).toBe('-0.40%');
    expect(formatPct(0)).toBe('0.00%');
  });

  it('treats zone-less backend timestamps as UTC', () => {
    const now = Date.parse('2026-10-15T12:00:00Z');
    expect(timeAgo('2026-10-15T11:55:00', now)).toBe('5m ago');
    expect(timeAgo('2026-10-15T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo(null, now)).toBe('—');
  });

  it('normalises symbols', () => {
    expect(normaliseSymbol('  reliance ')).toBe('RELIANCE');
    expect(normaliseSymbol('hdfc bank')).toBe('HDFCBANK');
  });
});
