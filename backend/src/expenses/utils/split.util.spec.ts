import { SplitType } from '../enums/split-type.enum';
import { computeShares, SplitError } from './split.util';

const total = (shares: { amount: number }[]) =>
  shares.reduce((sum, share) => sum + share.amount, 0);

describe('computeShares', () => {
  describe('equal', () => {
    it('splits 100.00 between 3 people as 33.34 + 33.33 + 33.33', () => {
      const shares = computeShares(10_000, SplitType.EQUAL, [
        { userId: 'a' },
        { userId: 'b' },
        { userId: 'c' },
      ]);
      expect(shares.map((s) => s.amount)).toEqual([3_334, 3_333, 3_333]);
      expect(total(shares)).toBe(10_000);
    });

    it('splits millimes with no rounding loss', () => {
      const shares = computeShares(100_000, SplitType.EQUAL, [
        { userId: 'a' },
        { userId: 'b' },
        { userId: 'c' },
        { userId: 'd' },
        { userId: 'e' },
        { userId: 'f' },
        { userId: 'g' },
      ]);
      expect(total(shares)).toBe(100_000);
      expect(
        Math.max(...shares.map((s) => s.amount)) -
          Math.min(...shares.map((s) => s.amount)),
      ).toBeLessThanOrEqual(1);
    });
  });

  describe('exact', () => {
    it('keeps the given amounts when they add up', () => {
      const shares = computeShares(20_000, SplitType.EXACT, [
        { userId: 'a', value: 12_500 },
        { userId: 'b', value: 7_500 },
      ]);
      expect(shares).toEqual([
        { userId: 'a', amount: 12_500 },
        { userId: 'b', amount: 7_500 },
      ]);
    });

    it('drops participants with a zero share', () => {
      const shares = computeShares(5_000, SplitType.EXACT, [
        { userId: 'a', value: 5_000 },
        { userId: 'b', value: 0 },
      ]);
      expect(shares).toEqual([{ userId: 'a', amount: 5_000 }]);
    });

    it('rejects amounts that do not add up', () => {
      expect(() =>
        computeShares(20_000, SplitType.EXACT, [
          { userId: 'a', value: 10_000 },
          { userId: 'b', value: 9_999 },
        ]),
      ).toThrow(SplitError);
    });
  });

  describe('percent', () => {
    it('splits by percentages in basis points', () => {
      const shares = computeShares(20_000, SplitType.PERCENT, [
        { userId: 'a', value: 5_000 },
        { userId: 'b', value: 3_000 },
        { userId: 'c', value: 2_000 },
      ]);
      expect(shares.map((s) => s.amount)).toEqual([10_000, 6_000, 4_000]);
    });

    it('gives leftover units to the largest remainders', () => {
      const shares = computeShares(100, SplitType.PERCENT, [
        { userId: 'a', value: 3_333 },
        { userId: 'b', value: 3_333 },
        { userId: 'c', value: 3_334 },
      ]);
      expect(shares.map((s) => s.amount)).toEqual([33, 33, 34]);
      expect(total(shares)).toBe(100);
    });

    it('rejects percentages that do not reach 100%', () => {
      expect(() =>
        computeShares(1_000, SplitType.PERCENT, [
          { userId: 'a', value: 5_000 },
          { userId: 'b', value: 4_000 },
        ]),
      ).toThrow('expected 100%');
    });
  });

  it('rejects non-integer, zero and negative amounts', () => {
    for (const amount of [0, -5, 10.5]) {
      expect(() =>
        computeShares(amount, SplitType.EQUAL, [{ userId: 'a' }]),
      ).toThrow(SplitError);
    }
  });

  it('rejects duplicate participants', () => {
    expect(() =>
      computeShares(1_000, SplitType.EQUAL, [{ userId: 'a' }, { userId: 'a' }]),
    ).toThrow('participants must be unique');
  });
});
