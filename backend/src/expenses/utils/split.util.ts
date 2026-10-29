import { SplitType } from '../enums/split-type.enum';

export const MAX_AMOUNT = 100_000_000_000;
export const FULL_PERCENT_BP = 10_000;

export type ShareInput = { userId: string; value?: number };
export type ComputedShare = { userId: string; amount: number };

export class SplitError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const assertAmount = (amount: number) => {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new SplitError(
      'INVALID_AMOUNT',
      'amount must be a positive integer in minor units',
    );
  }
};

const assertParticipants = (inputs: ShareInput[]) => {
  if (inputs.length === 0) {
    throw new SplitError(
      'NO_PARTICIPANTS',
      'at least one participant is required',
    );
  }
  const ids = new Set(inputs.map((input) => input.userId));
  if (ids.size !== inputs.length) {
    throw new SplitError(
      'DUPLICATE_PARTICIPANT',
      'participants must be unique',
    );
  }
};

const readValue = (input: ShareInput, max: number): number => {
  const value = input.value;
  if (
    value === undefined ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  ) {
    throw new SplitError(
      'INVALID_SHARE_VALUE',
      `invalid share value for ${input.userId}`,
    );
  }
  return value;
};

export const splitEqually = (
  amount: number,
  userIds: string[],
): ComputedShare[] => {
  const base = Math.floor(amount / userIds.length);
  const remainder = amount - base * userIds.length;
  return userIds.map((userId, index) => ({
    userId,
    amount: base + (index < remainder ? 1 : 0),
  }));
};

export const splitExactly = (
  amount: number,
  inputs: ShareInput[],
): ComputedShare[] => {
  const shares = inputs.map((input) => ({
    userId: input.userId,
    amount: readValue(input, MAX_AMOUNT),
  }));
  const total = shares.reduce((sum, share) => sum + share.amount, 0);
  if (total !== amount) {
    throw new SplitError(
      'EXACT_SUM_MISMATCH',
      `exact shares add up to ${total}, expected ${amount}`,
    );
  }
  return shares;
};

export const splitByPercent = (
  amount: number,
  inputs: ShareInput[],
): ComputedShare[] => {
  const percents = inputs.map((input) => readValue(input, FULL_PERCENT_BP));
  const totalBp = percents.reduce((sum, bp) => sum + bp, 0);
  if (totalBp !== FULL_PERCENT_BP) {
    throw new SplitError(
      'PERCENT_SUM_MISMATCH',
      `percentages add up to ${totalBp / 100}%, expected 100%`,
    );
  }

  const raw = percents.map((bp, index) => {
    const product = amount * bp;
    return {
      index,
      floor: Math.floor(product / FULL_PERCENT_BP),
      remainder: product % FULL_PERCENT_BP,
    };
  });

  let leftover = amount - raw.reduce((sum, part) => sum + part.floor, 0);
  const amounts = raw.map((part) => part.floor);
  const byRemainder = [...raw].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (const part of byRemainder) {
    if (leftover === 0) break;
    amounts[part.index] += 1;
    leftover -= 1;
  }

  return inputs.map((input, index) => ({
    userId: input.userId,
    amount: amounts[index],
  }));
};

export const computeShares = (
  amount: number,
  splitType: SplitType,
  inputs: ShareInput[],
): ComputedShare[] => {
  assertAmount(amount);
  assertParticipants(inputs);

  const shares =
    splitType === SplitType.EQUAL
      ? splitEqually(
          amount,
          inputs.map((input) => input.userId),
        )
      : splitType === SplitType.EXACT
        ? splitExactly(amount, inputs)
        : splitByPercent(amount, inputs);

  return shares.filter((share) => share.amount > 0);
};
