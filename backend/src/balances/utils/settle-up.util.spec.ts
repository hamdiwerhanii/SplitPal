import { settleUp, Transfer } from './settle-up.util';

const balancesOf = (entries: Record<string, number>) =>
  new Map(Object.entries(entries));

const applyTransfers = (
  balances: Map<string, number>,
  transfers: Transfer[],
) => {
  const after = new Map(balances);
  for (const { from, to, amount } of transfers) {
    after.set(from, (after.get(from) ?? 0) + amount);
    after.set(to, (after.get(to) ?? 0) - amount);
  }
  return after;
};

const seededRandom = (seed: number) => () => {
  seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
  return seed / 2_147_483_648;
};

describe('settleUp', () => {
  it('returns no payments when everyone is already even', () => {
    expect(settleUp(balancesOf({ a: 0, b: 0, c: 0 }))).toEqual([]);
  });

  it('settles two people with one payment', () => {
    expect(settleUp(balancesOf({ ahmed: 5_000, sarra: -5_000 }))).toEqual([
      { from: 'sarra', to: 'ahmed', amount: 5_000 },
    ]);
  });

  it('settles the Tozeur trip in 3 payments, biggest debtor first', () => {
    const balances = balancesOf({
      ahmed: 370_000,
      sarra: -110_000,
      hamdi: -30_000,
      mehdi: -230_000,
    });

    expect(settleUp(balances)).toEqual([
      { from: 'mehdi', to: 'ahmed', amount: 230_000 },
      { from: 'sarra', to: 'ahmed', amount: 110_000 },
      { from: 'hamdi', to: 'ahmed', amount: 30_000 },
    ]);
  });

  it('cancels a circular debt A -> B -> C -> A', () => {
    const balances = balancesOf({
      a: -1_000 + 1_000,
      b: 1_000 - 1_000,
      c: 1_000 - 1_000,
    });
    expect(settleUp(balances)).toEqual([]);
  });

  it('needs fewer payments than the raw debts', () => {
    const balances = balancesOf({ a: 3_000, b: -1_000, c: -2_000, d: 0 });
    const transfers = settleUp(balances);

    expect(transfers).toEqual([
      { from: 'c', to: 'a', amount: 2_000 },
      { from: 'b', to: 'a', amount: 1_000 },
    ]);
  });

  it('rejects balances that do not add up to zero', () => {
    expect(() => settleUp(balancesOf({ a: 10, b: -9 }))).toThrow('off by 1');
  });

  it('always settles a large random group with at most n - 1 payments', () => {
    const random = seededRandom(42);

    for (let round = 0; round < 50; round++) {
      const size = 2 + Math.floor(random() * 30);
      const ids = Array.from({ length: size }, (_, i) => `u${i}`);
      const nets = ids.map(() => Math.floor(random() * 2_000_001) - 1_000_000);
      nets[size - 1] -= nets.reduce((sum, value) => sum + value, 0);
      const balances = new Map(ids.map((id, i) => [id, nets[i]]));

      const transfers = settleUp(balances);
      const after = applyTransfers(balances, transfers);

      expect([...after.values()].every((value) => value === 0)).toBe(true);
      expect(transfers.length).toBeLessThanOrEqual(size - 1);
      expect(transfers.every((t) => t.amount > 0 && t.from !== t.to)).toBe(
        true,
      );
    }
  });
});
