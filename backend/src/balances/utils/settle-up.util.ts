export type Transfer = { from: string; to: string; amount: number };

type Party = { userId: string; amount: number };

const byAmountDesc = (a: Party, b: Party) =>
  b.amount - a.amount || a.userId.localeCompare(b.userId);

export const settleUp = (balances: Map<string, number>): Transfer[] => {
  let total = 0;
  const creditors: Party[] = [];
  const debtors: Party[] = [];

  for (const [userId, net] of balances) {
    if (!Number.isSafeInteger(net)) {
      throw new Error(`Balance of ${userId} is not an integer`);
    }
    total += net;
    if (net > 0) creditors.push({ userId, amount: net });
    if (net < 0) debtors.push({ userId, amount: -net });
  }

  if (total !== 0) {
    throw new Error(`Balances do not add up to zero (off by ${total})`);
  }

  const transfers: Transfer[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byAmountDesc);
    debtors.sort(byAmountDesc);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);

    transfers.push({ from: debtor.userId, to: creditor.userId, amount });
    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return transfers;
};
