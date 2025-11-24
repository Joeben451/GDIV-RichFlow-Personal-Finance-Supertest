import { PrismaClient } from '@prisma/client';
import {hashPassword} from '../src/utils/password.utils';

const prisma = new PrismaClient();



const users = [
  {
    name: 'admin',
    email: 'richflow@gdiv.se',
    password: 'C28Qw5UaXucMup',
    isAdmin: true,
    preferredCurrencyId: 1, // USD
  },
  {
    name: 'testuser1',
    email: 'testuser1@example.com',
    password: 'Test123!',
    isAdmin: false,
    preferredCurrencyId: 10, // USD
  },
  {
    name: 'testuser2',
    email: 'testuser2@example.com',
    password: 'Test123!',
    isAdmin: false,
    preferredCurrencyId: 20, // EUR
  },
  {
    name: 'testuser3',
    email: 'testuser3@example.com',
    password: 'Test123!',
    isAdmin: false,
    preferredCurrencyId: 30, // GBP
  },
];

async function main() {
  console.log('Starting user seed...');

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
    let userId = existingUser?.id;

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email: user.email },
        data: {
          name: user.name,
          password: hashedPassword,
          isAdmin: user.isAdmin,
          preferredCurrencyId: user.preferredCurrencyId,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Updated user: ${user.email} (${user.isAdmin ? 'Admin' : 'User'})`);
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          isAdmin: user.isAdmin,
          preferredCurrencyId: user.preferredCurrencyId,
          updatedAt: new Date(),
        },
      });
      userId = newUser.id;
      console.log(`✅ Created user: ${user.email} (${user.isAdmin ? 'Admin' : 'User'})`);

      // Log User Creation Event
      await prisma.event.create({
        data: {
          timestamp: new Date(),
          actionType: 'CREATE',
          entityType: 'USER',
          entitySubtype: null,
          beforeValue: null,
          afterValue: JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            preferredCurrencyId: newUser.preferredCurrencyId
          }),
          userId: newUser.id,
          entityId: newUser.id
        }
      });
    }

    if (userId) {
      // Ensure IncomeStatement exists
      let incomeStatement = await prisma.incomeStatement.findFirst({ where: { userId } });
      if (!incomeStatement) {
        incomeStatement = await prisma.incomeStatement.create({ data: { userId } });
        // Log Event
        await prisma.event.create({
          data: {
            timestamp: new Date(),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'INCOME_STATEMENT',
            beforeValue: null,
            afterValue: JSON.stringify({ id: incomeStatement.id, userId }),
            userId,
            entityId: incomeStatement.id
          }
        });
      }

      // Ensure BalanceSheet exists
      let balanceSheet = await prisma.balanceSheet.findFirst({ where: { userId } });
      if (!balanceSheet) {
        balanceSheet = await prisma.balanceSheet.create({ data: { userId } });
      }

      // Ensure CashSavings exists
      let cashSavings = await prisma.cashSavings.findFirst({ where: { userId } });
      if (!cashSavings) {
        cashSavings = await prisma.cashSavings.create({ data: { userId, amount: 0 } });
        // Log Event
        await prisma.event.create({
          data: {
            timestamp: new Date(),
            actionType: 'CREATE',
            entityType: 'CASH_SAVINGS',
            entitySubtype: null,
            beforeValue: null,
            afterValue: JSON.stringify({ id: cashSavings.id, userId, amount: 0 }),
            userId,
            entityId: cashSavings.id
          }
        });
      }
    }
  }

  console.log(`\n✅ Successfully seeded ${users.length} users`);
  console.log('\nUser credentials:');
  console.log('================');
  users.forEach((user) => {
    console.log(`${user.email} / ${user.password}`);
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
