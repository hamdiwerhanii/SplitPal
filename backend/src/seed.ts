import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { ExpenseCategory } from './expenses/enums/expense-category.enum';
import { SplitType } from './expenses/enums/split-type.enum';
import { ExpensesService } from './expenses/expenses.service';
import { Group } from './groups/entities/group.entity';
import { GroupsService } from './groups/groups.service';
import { User } from './user/entities/user.entity';
import { Locale } from './user/enums/locale.enum';
import { UserService } from './user/user.service';

process.env.PUSH_ENABLED = 'false';

const PEOPLE = [
  { email: 'ahmed@splitpal.test', name: 'Ahmed', locale: Locale.FR },
  { email: 'sarra@splitpal.test', name: 'Sarra', locale: Locale.FR },
  { email: 'hamdi@splitpal.test', name: 'Hamdi', locale: Locale.EN },
  { email: 'mehdi@splitpal.test', name: 'Mehdi', locale: Locale.AR },
];

async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  if (await userModel.exists({ email: PEOPLE[0].email })) {
    logger.log('Demo data already present, nothing to do');
    await app.close();
    return;
  }

  const userService = app.get(UserService);
  const groupsService = app.get(GroupsService);
  const expensesService = app.get(ExpensesService);
  const groupModel = app.get<Model<Group>>(getModelToken(Group.name));

  const users = [];
  for (const person of PEOPLE) {
    const { user } = await userService.findOrCreateByEmail(
      person.email,
      person.locale,
    );
    users.push(
      await userService.update(user._id.toString(), { name: person.name }),
    );
  }
  const [ahmed, sarra, hamdi, mehdi] = users.map((user) => user._id.toString());

  const trip = await groupsService.create(ahmed, {
    name: 'Tozeur Trip',
    currency: 'TND',
  });
  for (const userId of [sarra, hamdi, mehdi]) {
    await groupsService.join(userId, trip.inviteCode);
  }

  const tripGroup = await groupModel.findById(trip.id).orFail();
  const everyone = [ahmed, sarra, hamdi, mehdi].map((userId) => ({ userId }));
  const tripExpenses = [
    {
      paidBy: ahmed,
      description: 'Hotel Dar Tozeur',
      amount: 600_000,
      category: ExpenseCategory.TRAVEL,
    },
    {
      paidBy: sarra,
      description: 'Fuel',
      amount: 120_000,
      category: ExpenseCategory.TRANSPORT,
    },
    {
      paidBy: hamdi,
      description: 'Dinner',
      amount: 200_000,
      category: ExpenseCategory.FOOD,
    },
  ];
  for (const expense of tripExpenses) {
    await expensesService.create(expense.paidBy, tripGroup, {
      ...expense,
      splitType: SplitType.EQUAL,
      participants: everyone,
    });
  }

  const flat = await groupsService.create(hamdi, {
    name: 'Appartement Lac 2',
    currency: 'TND',
  });
  await groupsService.join(mehdi, flat.inviteCode);
  const flatGroup = await groupModel.findById(flat.id).orFail();
  await expensesService.create(hamdi, flatGroup, {
    paidBy: hamdi,
    description: 'Rent – November',
    amount: 1_200_000,
    category: ExpenseCategory.RENT,
    splitType: SplitType.PERCENT,
    participants: [
      { userId: hamdi, value: 6_000 },
      { userId: mehdi, value: 4_000 },
    ],
  });
  await expensesService.create(mehdi, flatGroup, {
    paidBy: mehdi,
    description: 'STEG electricity bill',
    amount: 87_450,
    category: ExpenseCategory.UTILITIES,
    splitType: SplitType.EQUAL,
    participants: [{ userId: hamdi }, { userId: mehdi }],
  });

  logger.log('Seeded 4 users, 2 groups and 5 expenses');
  logger.log(`Log in with any of: ${PEOPLE.map((p) => p.email).join(', ')}`);
  await app.close();
}

void seed();
