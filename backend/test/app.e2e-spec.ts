import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import request from 'supertest';

type Session = { accessToken: string; refreshToken: string; userId: string };

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const codesSentTo = (email: string): string[] => {
  const log = readFileSync(process.env.E2E_LOG_FILE!, 'utf8');
  const pattern = new RegExp(`OTP for ${escapeRegExp(email)}: (\\d{6})`, 'g');
  return [...log.matchAll(pattern)].map((match) => match[1]);
};

const lastCodeSentTo = async (email: string): Promise<string> => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const codes = codesSentTo(email);
    if (codes.length > 0) return codes[codes.length - 1];
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`No code was sent to ${email}`);
};

describe('SplitPal API (e2e)', () => {
  const api = () => request(process.env.E2E_BASE_URL!);
  const auth = (session: Session) => ({
    Authorization: `Bearer ${session.accessToken}`,
  });

  const login = async (email: string): Promise<Session> => {
    await api().post('/api/auth/otp/request').send({ email }).expect(200);
    const res = await api()
      .post('/api/auth/otp/verify')
      .send({ email, code: await lastCodeSentTo(email) })
      .expect(200);
    return {
      accessToken: res.body.accessToken,
      refreshToken: res.body.refreshToken,
      userId: res.body.user.id,
    };
  };

  describe('auth', () => {
    it('logs in with a code, returns a new user, and rejects reuse', async () => {
      const email = 'Nour@Example.com';
      await api().post('/api/auth/otp/request').send({ email }).expect(200);
      const code = await lastCodeSentTo('nour@example.com');
      expect(code).toMatch(/^\d{6}$/);

      const res = await api()
        .post('/api/auth/otp/verify')
        .send({ email, code })
        .expect(200);
      expect(res.body.isNewUser).toBe(true);
      expect(res.body.user.email).toBe('nour@example.com');
      expect(res.body.user.pushTokens).toBeUndefined();

      await api()
        .post('/api/auth/otp/verify')
        .send({ email, code })
        .expect(401);
    });

    it('does not resend a code during the cooldown', async () => {
      const email = 'cooldown@example.com';
      await api().post('/api/auth/otp/request').send({ email }).expect(200);
      await lastCodeSentTo(email);
      await api().post('/api/auth/otp/request').send({ email }).expect(200);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(codesSentTo(email)).toHaveLength(1);
    });

    it('locks a code after too many wrong attempts', async () => {
      const email = 'brute@example.com';
      await api().post('/api/auth/otp/request').send({ email }).expect(200);
      const code = await lastCodeSentTo(email);
      const wrong = code === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i++) {
        await api()
          .post('/api/auth/otp/verify')
          .send({ email, code: wrong })
          .expect(401);
      }
      await api()
        .post('/api/auth/otp/verify')
        .send({ email, code })
        .expect(401);
    });

    it('rotates refresh tokens and revokes the family on reuse', async () => {
      const session = await login('rotate@example.com');

      const rotated = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(200);
      expect(rotated.body.refreshToken).not.toBe(session.refreshToken);

      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(401);

      await api()
        .post('/api/auth/logout')
        .set({ Authorization: `Bearer ${rotated.body.accessToken}` })
        .send({ refreshToken: rotated.body.refreshToken })
        .expect(204);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: rotated.body.refreshToken })
        .expect(401);
    });

    it('rejects requests without a token', async () => {
      await api().get('/api/groups').expect(401);
      await api().get('/api/health').expect(200);
    });
  });

  describe('the Tozeur trip', () => {
    let ahmed: Session;
    let sarra: Session;
    let hamdi: Session;
    let mehdi: Session;
    let outsider: Session;
    let groupId: string;

    const everyone = () =>
      [ahmed, sarra, hamdi, mehdi].map((s) => ({ userId: s.userId }));

    beforeAll(async () => {
      [ahmed, sarra, hamdi, mehdi, outsider] = await Promise.all(
        ['ahmed', 'sarra', 'hamdi', 'mehdi', 'outsider'].map((name) =>
          login(`${name}@trip.test`),
        ),
      );

      const created = await api()
        .post('/api/groups')
        .set(auth(ahmed))
        .send({ name: 'Tozeur Trip', currency: 'TND' })
        .expect(201);
      groupId = created.body.id;
      expect(created.body.inviteUrl).toBe(
        `splitpal://join/${created.body.inviteCode}`,
      );

      const preview = await api()
        .get(`/api/groups/invites/${created.body.inviteCode.toLowerCase()}`)
        .set(auth(sarra))
        .expect(200);
      expect(preview.body).toMatchObject({
        name: 'Tozeur Trip',
        isMember: false,
      });

      for (const member of [sarra, hamdi, mehdi]) {
        await api()
          .post('/api/groups/join')
          .set(auth(member))
          .send({ inviteCode: created.body.inviteCode })
          .expect(200);
      }
    });

    it('hides the group from people who are not members', async () => {
      await api().get(`/api/groups/${groupId}`).set(auth(outsider)).expect(404);
      await api()
        .get(`/api/groups/${groupId}/expenses`)
        .set(auth(outsider))
        .expect(404);
      await api().get('/api/groups/not-an-id').set(auth(ahmed)).expect(404);
    });

    it('adds expenses idempotently and computes the minimal payments', async () => {
      const expenses = [
        {
          by: ahmed,
          description: 'Hotel',
          amount: 600_000,
          category: 'travel',
        },
        {
          by: sarra,
          description: 'Fuel',
          amount: 120_000,
          category: 'transport',
        },
        { by: hamdi, description: 'Dinner', amount: 200_000, category: 'food' },
      ];

      for (const expense of expenses) {
        const body = {
          clientId: randomUUID(),
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          paidBy: expense.by.userId,
          splitType: 'equal',
          participants: everyone(),
        };
        const first = await api()
          .post(`/api/groups/${groupId}/expenses`)
          .set(auth(expense.by))
          .send(body)
          .expect(201);
        const replay = await api()
          .post(`/api/groups/${groupId}/expenses`)
          .set(auth(expense.by))
          .send(body)
          .expect(200);
        expect(replay.body.id).toBe(first.body.id);
      }

      const list = await api()
        .get(`/api/groups/${groupId}/expenses`)
        .set(auth(mehdi))
        .expect(200);
      expect(list.body.data).toHaveLength(3);
      expect(list.body.data[0].description).toBe('Dinner');

      const balances = await api()
        .get(`/api/groups/${groupId}/balances`)
        .set(auth(mehdi))
        .expect(200);
      const net = Object.fromEntries(
        balances.body.balances.map((b: { userId: string; net: number }) => [
          b.userId,
          b.net,
        ]),
      );
      expect(net).toEqual({
        [ahmed.userId]: 370_000,
        [sarra.userId]: -110_000,
        [hamdi.userId]: -30_000,
        [mehdi.userId]: -230_000,
      });
      expect(balances.body.transfers).toEqual([
        { from: mehdi.userId, to: ahmed.userId, amount: 230_000 },
        { from: sarra.userId, to: ahmed.userId, amount: 110_000 },
        { from: hamdi.userId, to: ahmed.userId, amount: 30_000 },
      ]);

      const groups = await api()
        .get('/api/groups')
        .set(auth(ahmed))
        .expect(200);
      expect(groups.body[0]).toMatchObject({
        name: 'Tozeur Trip',
        myBalance: 370_000,
        memberCount: 4,
      });
    });

    it('rejects invalid expenses', async () => {
      const base = {
        description: 'Bad',
        category: 'food',
        paidBy: ahmed.userId,
        splitType: 'equal',
        participants: everyone(),
      };
      await api()
        .post(`/api/groups/${groupId}/expenses`)
        .set(auth(ahmed))
        .send({ ...base, amount: 10.5 })
        .expect(400);
      const outsiderShare = await api()
        .post(`/api/groups/${groupId}/expenses`)
        .set(auth(ahmed))
        .send({
          ...base,
          amount: 1_000,
          participants: [{ userId: outsider.userId }],
        })
        .expect(400);
      expect(outsiderShare.body.code).toBe('NOT_A_MEMBER');
      const badPercent = await api()
        .post(`/api/groups/${groupId}/expenses`)
        .set(auth(ahmed))
        .send({
          ...base,
          amount: 1_000,
          splitType: 'percent',
          participants: [{ userId: ahmed.userId, value: 5_000 }],
        })
        .expect(400);
      expect(badPercent.body.code).toBe('PERCENT_SUM_MISMATCH');
    });

    it('records payments and blocks leaving with an open balance', async () => {
      await api()
        .post(`/api/groups/${groupId}/leave`)
        .set(auth(mehdi))
        .expect(409);

      await api()
        .post(`/api/groups/${groupId}/settlements`)
        .set(auth(mehdi))
        .send({
          fromUserId: mehdi.userId,
          toUserId: ahmed.userId,
          amount: 230_000,
        })
        .expect(201);

      const balances = await api()
        .get(`/api/groups/${groupId}/balances`)
        .set(auth(ahmed))
        .expect(200);
      expect(balances.body.transfers).toHaveLength(2);

      await api()
        .post(`/api/groups/${groupId}/leave`)
        .set(auth(mehdi))
        .expect(204);
      await api().get(`/api/groups/${groupId}`).set(auth(mehdi)).expect(404);
    });

    it('replays the offline outbox without creating duplicates', async () => {
      const valid = {
        clientId: randomUUID(),
        type: 'expense.create',
        groupId,
        payload: {
          description: 'Dates souvenir',
          amount: 45_500,
          category: 'shopping',
          paidBy: sarra.userId,
          splitType: 'exact',
          participants: [
            { userId: sarra.userId, value: 20_000 },
            { userId: hamdi.userId, value: 25_500 },
          ],
          date: '2026-10-20T10:00:00.000Z',
        },
      };
      const invalid = {
        clientId: randomUUID(),
        type: 'expense.create',
        groupId,
        payload: { ...valid.payload, amount: -1 },
      };
      const operations = [valid, valid, invalid];

      const first = await api()
        .post('/api/sync')
        .set(auth(sarra))
        .send({ operations })
        .expect(200);
      expect(
        first.body.results.map((r: { status: string }) => r.status),
      ).toEqual(['created', 'duplicate', 'rejected']);

      const again = await api()
        .post('/api/sync')
        .set(auth(sarra))
        .send({ operations })
        .expect(200);
      expect(
        again.body.results.map((r: { status: string }) => r.status),
      ).toEqual(['duplicate', 'duplicate', 'rejected']);

      const list = await api()
        .get(`/api/groups/${groupId}/expenses?limit=50`)
        .set(auth(sarra))
        .expect(200);
      expect(
        list.body.data.filter(
          (e: { description: string }) => e.description === 'Dates souvenir',
        ),
      ).toHaveLength(1);
    });

    it('edits and deletes expenses and pages the activity feed', async () => {
      const created = await api()
        .post(`/api/groups/${groupId}/expenses`)
        .set(auth(hamdi))
        .send({
          description: 'Camel ride',
          amount: 90_000,
          category: 'entertainment',
          paidBy: hamdi.userId,
          splitType: 'percent',
          participants: [
            { userId: hamdi.userId, value: 5_000 },
            { userId: ahmed.userId, value: 5_000 },
          ],
        })
        .expect(201);

      const edited = await api()
        .patch(`/api/groups/${groupId}/expenses/${created.body.id}`)
        .set(auth(ahmed))
        .send({ amount: 100_000 })
        .expect(200);
      expect(
        edited.body.shares.map((s: { amount: number }) => s.amount),
      ).toEqual([50_000, 50_000]);

      await api()
        .delete(`/api/groups/${groupId}/expenses/${created.body.id}`)
        .set(auth(ahmed))
        .expect(204);

      const firstPage = await api()
        .get('/api/activity?limit=3')
        .set(auth(ahmed))
        .expect(200);
      expect(firstPage.body.data).toHaveLength(3);
      expect(firstPage.body.data[0].type).toBe('expense.deleted');
      expect(firstPage.body.data[0].actor.name).toBe('ahmed');

      const secondPage = await api()
        .get(`/api/activity?limit=3&cursor=${firstPage.body.nextCursor}`)
        .set(auth(ahmed))
        .expect(200);
      const firstIds = firstPage.body.data.map((a: { id: string }) => a.id);
      expect(
        secondPage.body.data.some((a: { id: string }) =>
          firstIds.includes(a.id),
        ),
      ).toBe(false);
    });
  });
});
