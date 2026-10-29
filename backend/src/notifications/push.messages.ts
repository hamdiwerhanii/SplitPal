import { Locale } from 'src/user/enums/locale.enum';

export type PushEvent =
  | {
      kind: 'expense.created';
      actorName: string;
      description: string;
      amount: string;
    }
  | {
      kind: 'expense.updated';
      actorName: string;
      description: string;
      amount: string;
    }
  | {
      kind: 'settlement.created';
      actorName: string;
      fromName: string;
      toName: string;
      amount: string;
    }
  | { kind: 'member.joined'; actorName: string };

type Templates = {
  [K in PushEvent['kind']]: (event: Extract<PushEvent, { kind: K }>) => string;
};

const TEMPLATES: Record<Locale, Templates> = {
  [Locale.EN]: {
    'expense.created': (e) =>
      `${e.actorName} added "${e.description} – ${e.amount}"`,
    'expense.updated': (e) =>
      `${e.actorName} edited "${e.description} – ${e.amount}"`,
    'settlement.created': (e) => `${e.fromName} paid ${e.toName} ${e.amount}`,
    'member.joined': (e) => `${e.actorName} joined the group`,
  },
  [Locale.FR]: {
    'expense.created': (e) =>
      `${e.actorName} a ajouté « ${e.description} – ${e.amount} »`,
    'expense.updated': (e) =>
      `${e.actorName} a modifié « ${e.description} – ${e.amount} »`,
    'settlement.created': (e) =>
      `${e.fromName} a payé ${e.amount} à ${e.toName}`,
    'member.joined': (e) => `${e.actorName} a rejoint le groupe`,
  },
  [Locale.AR]: {
    'expense.created': (e) =>
      `أضاف ${e.actorName} "${e.description} – ${e.amount}"`,
    'expense.updated': (e) =>
      `عدّل ${e.actorName} "${e.description} – ${e.amount}"`,
    'settlement.created': (e) =>
      `دفع ${e.fromName} إلى ${e.toName} مبلغ ${e.amount}`,
    'member.joined': (e) => `انضم ${e.actorName} إلى المجموعة`,
  },
};

export const buildPushBody = (locale: Locale, event: PushEvent): string => {
  const templates = TEMPLATES[locale] ?? TEMPLATES[Locale.EN];
  const render = templates[event.kind] as (e: PushEvent) => string;
  return render(event);
};
