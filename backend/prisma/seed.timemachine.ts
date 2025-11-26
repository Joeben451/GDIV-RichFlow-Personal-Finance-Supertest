import { Prisma, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.utils';

const prisma = new PrismaClient();

/**
 * Time Machine Test User Seed
 * Creates a user with complete financial history from Jan 1, 2024 to Nov 21, 2025
 * This demonstrates the point-in-time reconstruction feature
 */

const TEST_USER = {
  name: 'timemachine_user',
  email: 'timemachine@test.com',
  password: 'TimeMachine2024!',
  isAdmin: false,
  preferredCurrencyId: 1, // USD
  createdAt: new Date('2020-01-01T10:00:00Z'),
};

async function main() {
  console.log('🕐 Starting Time Machine Test User Seed...');
  console.log('📅 Date Range: January 1, 2020 → November 21, 2025\n');

  // Hash password
  const hashedPassword = await hashPassword(TEST_USER.password);

  // Delete existing test user if exists
  await prisma.event.deleteMany({
    where: {
      User: {
        email: TEST_USER.email
      }
    }
  });

  await prisma.user.deleteMany({
    where: { email: TEST_USER.email }
  });

  console.log('🗑️  Cleaned up existing test user data\n');

  // Create user with backdated timestamp
  const user = await prisma.user.create({
    data: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: hashedPassword,
      isAdmin: TEST_USER.isAdmin,
      preferredCurrencyId: TEST_USER.preferredCurrencyId,
      createdAt: TEST_USER.createdAt,
      updatedAt: TEST_USER.createdAt,
      lastLogin: null,
    },
  });

  console.log(`✅ Created user: ${user.email}`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Created: ${TEST_USER.createdAt.toISOString()}\n`);

  // Create Income Statement
  const incomeStatement = await prisma.incomeStatement.create({
    data: {
      userId: user.id,
    },
  });

  // Create Cash Savings
  const cashSavings = await prisma.cashSavings.create({
    data: {
      userId: user.id,
      amount: 0,
    },
  });

  // Create Balance Sheet
  const balanceSheet = await prisma.balanceSheet.create({
    data: {
      userId: user.id,
    },
  });

  // Log initial creation events
  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-01T10:00:00Z'),
      actionType: 'CREATE',
      entityType: 'INCOME',
      entitySubtype: 'INCOME_STATEMENT',
      beforeValue: Prisma.DbNull,
      afterValue: { id: incomeStatement.id, userId: user.id },
      userId: user.id,
      entityId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-01T10:00:00Z'),
      actionType: 'CREATE',
      entityType: 'CASH_SAVINGS',
      entitySubtype: null,
      beforeValue: Prisma.DbNull,
      afterValue: { id: cashSavings.id, userId: user.id, amount: 0 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  console.log('✅ Created initial financial records (IncomeStatement, CashSavings, BalanceSheet)\n');

  // ==========================================
  // JANUARY 2020 - Early Career
  // ==========================================
  console.log('📆 JANUARY 2020 - Early Career (Junior Developer)');

  // Initial salary (Junior)
  const salary1 = await prisma.incomeLine.create({
    data: {
      name: 'Junior Developer Salary',
      amount: 3200,
      type: 'EARNED',
      quadrant: 'EMPLOYEE',
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-05T09:00:00Z'),
      actionType: 'CREATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: Prisma.DbNull,
      afterValue: { name: salary1.name, amount: 3200, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  // Initial expenses
  const rent1 = await prisma.expense.create({
    data: {
      name: 'Apartment Rent',
      amount: 1000,
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-10T14:00:00Z'),
      actionType: 'CREATE',
      entityType: 'EXPENSE',
      beforeValue: Prisma.DbNull,
      afterValue: { name: rent1.name, amount: 1000 },
      userId: user.id,
      entityId: rent1.id,
    },
  });

  const utilities = await prisma.expense.create({
    data: {
      name: 'Utilities',
      amount: 120,
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-10T14:30:00Z'),
      actionType: 'CREATE',
      entityType: 'EXPENSE',
      beforeValue: Prisma.DbNull,
      afterValue: { name: utilities.name, amount: 120 },
      userId: user.id,
      entityId: utilities.id,
    },
  });

  const groceries = await prisma.expense.create({
    data: {
      name: 'Groceries',
      amount: 300,
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2020-01-15T16:00:00Z'),
      actionType: 'CREATE',
      entityType: 'EXPENSE',
      beforeValue: Prisma.DbNull,
      afterValue: { name: groceries.name, amount: 300 },
      userId: user.id,
      entityId: groceries.id,
    },
  });

  console.log('   ✅ Income: $3,200/month (Junior Dev)');
  console.log('   ✅ Expenses: $1,420/month\n');

  // Snapshot Jan 2020
  await prisma.financialSnapshot.create({
    data: {
      userId: user.id,
      date: new Date('2020-01-31T23:59:59Z'),
      data: {
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalIncome: 3200,
        totalExpenses: 1420
      }
    }
  });

  // ==========================================
  // 2021-2023 - Career Growth
  // ==========================================
  console.log('📆 2021-2023 - Career Growth & Raises');

  // Jan 2021 Raise
  await prisma.incomeLine.update({
    where: { id: salary1.id },
    data: { amount: 3500 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2021-01-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: 'Junior Developer Salary', amount: 3200, type: 'EARNED', quadrant: 'EMPLOYEE' },
      afterValue: { name: 'Junior Developer Salary', amount: 3500, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  // Jan 2021 Savings
  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 1000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2021-01-15T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 0 },
      afterValue: { id: cashSavings.id, amount: 1000 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  // Jan 2022 Raise
  await prisma.incomeLine.update({
    where: { id: salary1.id },
    data: { amount: 3800 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2022-01-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: 'Junior Developer Salary', amount: 3500, type: 'EARNED', quadrant: 'EMPLOYEE' },
      afterValue: { name: 'Junior Developer Salary', amount: 3800, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  // Jan 2022 Savings
  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 2000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2022-01-15T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 1000 },
      afterValue: { id: cashSavings.id, amount: 2000 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  // Jan 2023 Raise
  await prisma.incomeLine.update({
    where: { id: salary1.id },
    data: { amount: 4200 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2023-01-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: 'Junior Developer Salary', amount: 3800, type: 'EARNED', quadrant: 'EMPLOYEE' },
      afterValue: { name: 'Junior Developer Salary', amount: 4200, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  // Jan 2023 Savings
  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 2500 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2023-01-15T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 2000 },
      afterValue: { id: cashSavings.id, amount: 2500 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  console.log('   ✅ 2021-2023: Salary grew $3,200 → $4,200');
  console.log('   ✅ Savings accumulated: $2,500\n');

  // Snapshot Jan 2023
  await prisma.financialSnapshot.create({
    data: {
      userId: user.id,
      date: new Date('2023-01-31T23:59:59Z'),
      data: {
        netWorth: 2500,
        totalAssets: 2500,
        totalLiabilities: 0,
        totalIncome: 4200,
        totalExpenses: 1420 // Assuming expenses stayed roughly same for simplicity in snapshot
      }
    }
  });

  // ==========================================
  // JANUARY 2024 - Promotion to Senior
  // ==========================================
  console.log('📆 JANUARY 2024 - Promotion to Software Engineer');

  // Update salary to match original story start
  await prisma.incomeLine.update({
    where: { id: salary1.id },
    data: { name: 'Software Engineer Salary', amount: 4500 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-01-05T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: 'Junior Developer Salary', amount: 4200, type: 'EARNED', quadrant: 'EMPLOYEE' },
      afterValue: { name: 'Software Engineer Salary', amount: 4500, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  // Update expenses to match original story
  await prisma.expense.update({
    where: { id: rent1.id },
    data: { amount: 1200 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-01-10T14:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'EXPENSE',
      beforeValue: { name: rent1.name, amount: 1000 },
      afterValue: { name: rent1.name, amount: 1200 },
      userId: user.id,
      entityId: rent1.id,
    },
  });

  await prisma.expense.update({
    where: { id: utilities.id },
    data: { amount: 150 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-01-10T14:30:00Z'),
      actionType: 'UPDATE',
      entityType: 'EXPENSE',
      beforeValue: { name: utilities.name, amount: 120 },
      afterValue: { name: utilities.name, amount: 150 },
      userId: user.id,
      entityId: utilities.id,
    },
  });

  await prisma.expense.update({
    where: { id: groceries.id },
    data: { amount: 400 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-01-15T16:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'EXPENSE',
      beforeValue: { name: groceries.name, amount: 300 },
      afterValue: { name: groceries.name, amount: 400 },
      userId: user.id,
      entityId: groceries.id,
    },
  });

  console.log('   ✅ Income: $4,500/month (Salary)');
  console.log('   ✅ Expenses: $1,750/month (Rent, Utilities, Groceries)\n');

  // ==========================================
  // MARCH 2024 - First Savings & Asset
  // ==========================================
  console.log('📆 MARCH 2024 - Building Emergency Fund');

  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 3000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-03-01T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 2500 },
      afterValue: { id: cashSavings.id, amount: 3000 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  const car = await prisma.asset.create({
    data: {
      name: 'Used Car',
      value: 8000,
      bsId: balanceSheet.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-03-15T11:00:00Z'),
      actionType: 'CREATE',
      entityType: 'ASSET',
      beforeValue: Prisma.DbNull,
      afterValue: { name: car.name, value: 8000 },
      userId: user.id,
      entityId: car.id,
    },
  });

  const carLoan = await prisma.liability.create({
    data: {
      name: 'Car Loan',
      value: 5000,
      bsId: balanceSheet.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-03-15T11:30:00Z'),
      actionType: 'CREATE',
      entityType: 'LIABILITY',
      beforeValue: Prisma.DbNull,
      afterValue: { name: carLoan.name, value: 5000 },
      userId: user.id,
      entityId: carLoan.id,
    },
  });

  console.log('   ✅ Cash Savings: $3,000');
  console.log('   ✅ Asset: Used Car ($8,000)');
  console.log('   ✅ Liability: Car Loan ($5,000)\n');

  // Snapshot March 2024
  await prisma.financialSnapshot.create({
    data: {
      userId: user.id,
      date: new Date('2024-03-31T23:59:59Z'),
      data: {
        netWorth: 3000 + 8000 - 5000, // Cash + Car - Loan = 6000
        totalAssets: 11000, // 3000 Cash + 8000 Car
        totalLiabilities: 5000,
        totalIncome: 4500,
        totalExpenses: 1750
      }
    }
  });

  // ==========================================
  // JUNE 2024 - Salary Raise
  // ==========================================
  console.log('📆 JUNE 2024 - Salary Raise');

  await prisma.incomeLine.update({
    where: { id: salary1.id },
    data: { name: 'Software Engineer Salary (Raised)', amount: 5200 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-06-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: 'Software Engineer Salary', amount: 4500, type: 'EARNED', quadrant: 'EMPLOYEE' },
      afterValue: { name: 'Software Engineer Salary (Raised)', amount: 5200, type: 'EARNED', quadrant: 'EMPLOYEE' },
      userId: user.id,
      entityId: salary1.id,
    },
  });

  console.log('   ✅ Salary increased: $4,500 → $5,200/month\n');

  // ==========================================
  // AUGUST 2024 - Side Hustle Begins
  // ==========================================
  console.log('📆 AUGUST 2024 - Started Side Business');

  const freelance = await prisma.incomeLine.create({
    data: {
      name: 'Freelance Consulting',
      amount: 800,
      type: 'EARNED',
      quadrant: 'SELF_EMPLOYED',
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-08-10T15:00:00Z'),
      actionType: 'CREATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: Prisma.DbNull,
      afterValue: { name: freelance.name, amount: 800, type: 'EARNED', quadrant: 'SELF_EMPLOYED' },
      userId: user.id,
      entityId: freelance.id,
    },
  });

  console.log('   ✅ New Income: Freelance Consulting ($800/month)\n');

  // ==========================================
  // OCTOBER 2024 - Investment Begins
  // ==========================================
  console.log('📆 OCTOBER 2024 - Started Investing');

  const stocks = await prisma.asset.create({
    data: {
      name: 'Stock Portfolio',
      value: 5000,
      bsId: balanceSheet.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-10-05T10:00:00Z'),
      actionType: 'CREATE',
      entityType: 'ASSET',
      beforeValue: Prisma.DbNull,
      afterValue: { name: stocks.name, value: 5000 },
      userId: user.id,
      entityId: stocks.id,
    },
  });

  const dividends = await prisma.incomeLine.create({
    data: {
      name: 'Stock Dividends',
      amount: 50,
      type: 'PORTFOLIO',
      quadrant: 'INVESTOR',
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-10-15T14:00:00Z'),
      actionType: 'CREATE',
      entityType: 'INCOME',
      entitySubtype: 'PORTFOLIO',
      beforeValue: Prisma.DbNull,
      afterValue: { name: dividends.name, amount: 50, type: 'PORTFOLIO', quadrant: 'INVESTOR' },
      userId: user.id,
      entityId: dividends.id,
    },
  });

  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 8000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2024-10-20T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 3000 },
      afterValue: { id: cashSavings.id, amount: 8000 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  console.log('   ✅ Asset: Stock Portfolio ($5,000)');
  console.log('   ✅ Income: Stock Dividends ($50/month)');
  console.log('   ✅ Cash Savings increased to $8,000\n');

  // Snapshot Oct 2024
  await prisma.financialSnapshot.create({
    data: {
      userId: user.id,
      date: new Date('2024-10-31T23:59:59Z'),
      data: {
        netWorth: 8000 + 8000 + 5000 - 5000, // Cash + Car + Stocks - Loan = 16000
        totalAssets: 21000, // 8000 Cash + 8000 Car + 5000 Stocks
        totalLiabilities: 5000,
        totalIncome: 5200 + 800 + 50, // Salary + Freelance + Divs = 6050
        totalExpenses: 1750
      }
    }
  });

  // ==========================================
  // JANUARY 2025 - Paid Off Car Loan
  // ==========================================
  console.log('📆 JANUARY 2025 - Paid Off Car Loan');

  await prisma.liability.delete({
    where: { id: carLoan.id },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-01-15T12:00:00Z'),
      actionType: 'DELETE',
      entityType: 'LIABILITY',
      beforeValue: { name: carLoan.name, value: 5000 },
      afterValue: Prisma.DbNull,
      userId: user.id,
      entityId: carLoan.id,
    },
  });

  console.log('   ✅ Liability removed: Car Loan paid off!\n');

  // ==========================================
  // FEBRUARY 2025 - Currency Change (USD -> EUR)
  // ==========================================
  console.log('📆 FEBRUARY 2025 - Relocated to Europe (Currency Change)');

  // Update user preferred currency to EUR (assuming ID 2 is EUR, check your seed.currency.ts)
  // For this test, we'll assume: 1=USD, 2=EUR, 3=GBP
  await prisma.user.update({
    where: { id: user.id },
    data: { preferredCurrencyId: 2 }, // EUR
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-02-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'USER',
      beforeValue: { preferredCurrencyId: 1, currencyCode: '$', currencyName: 'USD' },
      afterValue: { preferredCurrencyId: 2, currencyCode: '€', currencyName: 'EUR' },
      userId: user.id,
      entityId: user.id,
    },
  });

  console.log('   ✅ Currency changed: USD ($) → EUR (€)\n');

  // ==========================================
  // MARCH 2025 - Rental Property Investment
  // ==========================================
  console.log('📆 MARCH 2025 - Purchased Rental Property');

  const rentalProperty = await prisma.asset.create({
    data: {
      name: 'Rental Property',
      value: 150000,
      bsId: balanceSheet.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-03-10T10:00:00Z'),
      actionType: 'CREATE',
      entityType: 'ASSET',
      beforeValue: Prisma.DbNull,
      afterValue: { name: rentalProperty.name, value: 150000 },
      userId: user.id,
      entityId: rentalProperty.id,
    },
  });

  const mortgage = await prisma.liability.create({
    data: {
      name: 'Mortgage',
      value: 120000,
      bsId: balanceSheet.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-03-10T10:30:00Z'),
      actionType: 'CREATE',
      entityType: 'LIABILITY',
      beforeValue: Prisma.DbNull,
      afterValue: { name: mortgage.name, value: 120000 },
      userId: user.id,
      entityId: mortgage.id,
    },
  });

  const rentalIncome = await prisma.incomeLine.create({
    data: {
      name: 'Rental Income',
      amount: 1200,
      type: 'PASSIVE',
      quadrant: 'INVESTOR',
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-03-20T14:00:00Z'),
      actionType: 'CREATE',
      entityType: 'INCOME',
      entitySubtype: 'PASSIVE',
      beforeValue: Prisma.DbNull,
      afterValue: { name: rentalIncome.name, amount: 1200, type: 'PASSIVE', quadrant: 'INVESTOR' },
      userId: user.id,
      entityId: rentalIncome.id,
    },
  });

  const propertyTax = await prisma.expense.create({
    data: {
      name: 'Property Tax & Maintenance',
      amount: 400,
      isId: incomeStatement.id,
    },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-03-25T11:00:00Z'),
      actionType: 'CREATE',
      entityType: 'EXPENSE',
      beforeValue: Prisma.DbNull,
      afterValue: { name: propertyTax.name, amount: 400 },
      userId: user.id,
      entityId: propertyTax.id,
    },
  });

  console.log('   ✅ Asset: Rental Property ($150,000)');
  console.log('   ✅ Liability: Mortgage ($120,000)');
  console.log('   ✅ Income: Rental Income ($1,200/month)');
  console.log('   ✅ Expense: Property Tax & Maintenance ($400/month)\n');

  // Snapshot March 2025
  await prisma.financialSnapshot.create({
    data: {
      userId: user.id,
      date: new Date('2025-03-31T23:59:59Z'),
      data: {
        netWorth: 8000 + 8000 + 5000 + 150000 - 120000, // Cash + Car + Stocks + Rental - Mortgage = 51000
        totalAssets: 171000,
        totalLiabilities: 120000,
        totalIncome: 5200 + 800 + 50 + 1200, // 7250
        totalExpenses: 1750 + 400 // 2150
      }
    }
  });

  // ==========================================
  // JUNE 2025 - Portfolio Growth
  // ==========================================
  console.log('📆 JUNE 2025 - Portfolio Growth');

  await prisma.asset.update({
    where: { id: stocks.id },
    data: { value: 12000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-06-15T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'ASSET',
      beforeValue: { name: stocks.name, value: 5000 },
      afterValue: { name: stocks.name, value: 12000 },
      userId: user.id,
      entityId: stocks.id,
    },
  });

  await prisma.incomeLine.update({
    where: { id: dividends.id },
    data: { amount: 120 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-06-20T14:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'PORTFOLIO',
      beforeValue: { name: dividends.name, amount: 50, type: 'PORTFOLIO', quadrant: 'INVESTOR' },
      afterValue: { name: dividends.name, amount: 120, type: 'PORTFOLIO', quadrant: 'INVESTOR' },
      userId: user.id,
      entityId: dividends.id,
    },
  });

  console.log('   ✅ Stock Portfolio value: $5,000 → $12,000');
  console.log('   ✅ Dividends increased: $50 → $120/month\n');

  // ==========================================
  // SEPTEMBER 2025 - Freelance Business Growth
  // ==========================================
  console.log('📆 SEPTEMBER 2025 - Freelance Business Expansion');

  await prisma.incomeLine.update({
    where: { id: freelance.id },
    data: { amount: 2500 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-09-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'INCOME',
      entitySubtype: 'EARNED',
      beforeValue: { name: freelance.name, amount: 800, type: 'EARNED', quadrant: 'SELF_EMPLOYED' },
      afterValue: { name: freelance.name, amount: 2500, type: 'EARNED', quadrant: 'SELF_EMPLOYED' },
      userId: user.id,
      entityId: freelance.id,
    },
  });

  await prisma.cashSavings.update({
    where: { id: cashSavings.id },
    data: { amount: 25000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-09-15T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'CASH_SAVINGS',
      beforeValue: { id: cashSavings.id, amount: 8000 },
      afterValue: { id: cashSavings.id, amount: 25000 },
      userId: user.id,
      entityId: cashSavings.id,
    },
  });

  console.log('   ✅ Freelance income: $800 → $2,500/month');
  console.log('   ✅ Cash Savings: $8,000 → $25,000\n');

  // ==========================================
  // OCTOBER 2025 - Currency Change (EUR -> GBP)
  // ==========================================
  console.log('📆 OCTOBER 2025 - Business Trip to UK (Currency Change)');

  await prisma.user.update({
    where: { id: user.id },
    data: { preferredCurrencyId: 3 }, // GBP
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-10-01T09:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'USER',
      beforeValue: { preferredCurrencyId: 2, currencyCode: '€', currencyName: 'EUR' },
      afterValue: { preferredCurrencyId: 3, currencyCode: '£', currencyName: 'GBP' },
      userId: user.id,
      entityId: user.id,
    },
  });

  console.log('   ✅ Currency changed: EUR (€) → GBP (£)\n');

  // ==========================================
  // NOVEMBER 2025 - Current State
  // ==========================================
  console.log('📆 NOVEMBER 2025 - Current Financial Status');

  // Pay down mortgage
  await prisma.liability.update({
    where: { id: mortgage.id },
    data: { value: 115000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-11-01T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'LIABILITY',
      beforeValue: { name: mortgage.name, value: 120000 },
      afterValue: { name: mortgage.name, value: 115000 },
      userId: user.id,
      entityId: mortgage.id,
    },
  });

  // Car depreciation
  await prisma.asset.update({
    where: { id: car.id },
    data: { value: 6000 },
  });

  await prisma.event.create({
    data: {
      timestamp: new Date('2025-11-10T10:00:00Z'),
      actionType: 'UPDATE',
      entityType: 'ASSET',
      beforeValue: { name: car.name, value: 8000 },
      afterValue: { name: car.name, value: 6000 },
      userId: user.id,
      entityId: car.id,
    },
  });

  console.log('   ✅ Mortgage paid down: $120,000 → $115,000');
  console.log('   ✅ Car value adjusted: $8,000 → $6,000\n');

  // ==========================================
  // Final Summary
  // ==========================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 FINAL FINANCIAL SUMMARY (November 21, 2025)');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('💰 INCOME STREAMS:');
  console.log('   • Employee Salary: $5,200/month');
  console.log('   • Freelance: $2,500/month');
  console.log('   • Rental Income: $1,200/month (Passive)');
  console.log('   • Stock Dividends: $120/month (Portfolio)');
  console.log('   • TOTAL INCOME: $9,020/month\n');

  console.log('💸 EXPENSES:');
  console.log('   • Rent: $1,200/month');
  console.log('   • Utilities: $150/month');
  console.log('   • Groceries: $400/month');
  console.log('   • Property Tax: $400/month');
  console.log('   • TOTAL EXPENSES: $2,150/month\n');

  console.log('📈 ASSETS:');
  console.log('   • Cash Savings: $25,000');
  console.log('   • Car: $6,000');
  console.log('   • Stock Portfolio: $12,000');
  console.log('   • Rental Property: $150,000');
  console.log('   • TOTAL ASSETS: $193,000\n');

  console.log('📉 LIABILITIES:');
  console.log('   • Mortgage: $115,000');
  console.log('   • TOTAL LIABILITIES: $115,000\n');

  console.log('🎯 NET WORTH: $78,000');
  console.log('💵 NET CASHFLOW: $6,870/month\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Time Machine Test User Created Successfully!');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🔑 LOGIN CREDENTIALS:');
  console.log(`   Email: ${TEST_USER.email}`);
  console.log(`   Password: ${TEST_USER.password}\n`);

  console.log('📅 TEST DATES TO TRY:');
  console.log('   • 2020-01-01 - Account creation (Early Career)');
  console.log('   • 2021-01-15 - First raise & savings');
  console.log('   • 2024-01-05 - Promotion to Senior');
  console.log('   • 2024-03-15 - First car purchase');
  console.log('   • 2024-06-01 - After salary raise');
  console.log('   • 2024-10-15 - Started investing');
  console.log('   • 2025-01-15 - After paying off car loan');
  console.log('   • 2025-02-05 - Currency changed to EUR');
  console.log('   • 2025-03-20 - After rental property purchase');
  console.log('   • 2025-09-15 - Major cash savings growth');
  console.log('   • 2025-10-05 - Currency changed to GBP');
  console.log('   • 2025-11-21 - Current state (today)\n');

  const eventCount = await prisma.event.count({
    where: { userId: user.id },
  });

  console.log(`📝 Total Events Logged: ${eventCount}`);
  console.log('🎉 Ready for time machine testing!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Time Machine test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
