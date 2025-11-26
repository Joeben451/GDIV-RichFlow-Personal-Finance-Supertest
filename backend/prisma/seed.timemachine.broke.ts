import { Prisma, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.utils';

const prisma = new PrismaClient();

/**
 * Time Machine Broke User Seed
 * Creates a user with a "Riches to Rags" financial history from Jan 1, 2020 to Nov 2025.
 * Narrative: Stability -> Job Loss -> Debt Spiral -> Bankruptcy/Broke.
 */

const TEST_USER = {
    name: 'broke_user',
    email: 'broke@test.com',
    password: 'Broke2025!',
    isAdmin: false,
    preferredCurrencyId: 1, // USD
    createdAt: new Date('2020-01-01T10:00:00Z'),
};

async function main() {
    console.log('🕐 Starting Time Machine "Financially Broke" Seed...');
    console.log('📅 Date Range: January 1, 2020 → November 2025\n');

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

    console.log('🗑️  Cleaned up existing broke user data\n');

    // Create user
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

    // Create Financial Containers
    const incomeStatement = await prisma.incomeStatement.create({ data: { userId: user.id } });
    const cashSavings = await prisma.cashSavings.create({ data: { userId: user.id, amount: 20000 } }); // Started with decent savings
    const balanceSheet = await prisma.balanceSheet.create({ data: { userId: user.id } });

    // Log initial creation
    const initialDate = new Date('2020-01-01T10:00:00Z');

    await prisma.event.create({
        data: {
            timestamp: initialDate,
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
            timestamp: initialDate,
            actionType: 'CREATE',
            entityType: 'CASH_SAVINGS',
            entitySubtype: null,
            beforeValue: Prisma.DbNull,
            afterValue: { id: cashSavings.id, userId: user.id, amount: 20000 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    // ==========================================
    // PHASE 1: STABILITY (2020-2021)
    // Good job, manageable expenses, buying a house
    // ==========================================
    console.log('📆 PHASE 1: STABILITY (2020-2021)');

    // 1. Good Job
    const job = await prisma.incomeLine.create({
        data: {
            name: 'Senior Manager',
            amount: 8000,
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
            afterValue: { name: job.name, amount: 8000, type: 'EARNED', quadrant: 'EMPLOYEE' },
            userId: user.id,
            entityId: job.id,
        },
    });

    // 2. Lifestyle Expenses
    const lifestyle = await prisma.expense.create({
        data: { name: 'Lifestyle Expenses', amount: 4000, isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-01-10T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'EXPENSE',
            beforeValue: Prisma.DbNull,
            afterValue: { name: lifestyle.name, amount: 4000 },
            userId: user.id,
            entityId: lifestyle.id,
        },
    });

    // 3. Buy a House (High Leverage)
    const house = await prisma.asset.create({
        data: { name: 'Luxury Condo', value: 500000, bsId: balanceSheet.id },
    });
    const mortgage = await prisma.liability.create({
        data: { name: 'Mortgage', value: 450000, bsId: balanceSheet.id },
    });
    const mortgagePayment = await prisma.expense.create({
        data: { name: 'Mortgage Payment', amount: 2500, isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-06-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'ASSET',
            beforeValue: Prisma.DbNull,
            afterValue: { name: house.name, value: 500000 },
            userId: user.id,
            entityId: house.id,
        },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-06-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: mortgage.name, value: 450000 },
            userId: user.id,
            entityId: mortgage.id,
        },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-06-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'EXPENSE',
            beforeValue: Prisma.DbNull,
            afterValue: { name: mortgagePayment.name, amount: 2500 },
            userId: user.id,
            entityId: mortgagePayment.id,
        },
    });

    // Down payment hit savings
    await prisma.cashSavings.update({ where: { id: cashSavings.id }, data: { amount: 5000 } });
    await prisma.event.create({
        data: {
            timestamp: new Date('2020-06-15T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'CASH_SAVINGS',
            beforeValue: { id: cashSavings.id, amount: 20000 },
            afterValue: { id: cashSavings.id, amount: 5000 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    console.log('   ✅ High Income: $8,000');
    console.log('   ✅ High Expenses: $6,500');
    console.log('   ✅ Net Worth: $55,000 (House Equity + Cash)\n');

    // Snapshot Jan 2021 (Peak)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2021-01-31T23:59:59Z'),
            data: {
                netWorth: 5000 + 500000 - 450000, // 55000
                totalAssets: 505000,
                totalLiabilities: 450000,
                totalIncome: 8000,
                totalExpenses: 6500
            }
        }
    });

    // ==========================================
    // PHASE 2: THE CRASH (2022)
    // Job Loss, Market Crash
    // ==========================================
    console.log('📆 PHASE 2: THE CRASH (2022)');

    // Job Loss
    await prisma.incomeLine.delete({ where: { id: job.id } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-03-01T09:00:00Z'),
            actionType: 'DELETE',
            entityType: 'INCOME',
            beforeValue: { name: job.name, amount: 8000, type: 'EARNED', quadrant: 'EMPLOYEE' },
            afterValue: Prisma.DbNull,
            userId: user.id,
            entityId: job.id,
        },
    });

    // Severance package (One time bump)
    await prisma.cashSavings.update({ where: { id: cashSavings.id }, data: { amount: 15000 } });
    await prisma.event.create({
        data: {
            timestamp: new Date('2022-03-05T09:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'CASH_SAVINGS',
            beforeValue: { id: cashSavings.id, amount: 5000 },
            afterValue: { id: cashSavings.id, amount: 15000 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    // Unemployment benefits (Low income)
    const unemployment = await prisma.incomeLine.create({
        data: { name: 'Unemployment Benefits', amount: 1500, type: 'EARNED', quadrant: 'EMPLOYEE', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-04-01T09:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'EARNED',
            beforeValue: Prisma.DbNull,
            afterValue: { name: unemployment.name, amount: 1500, type: 'EARNED', quadrant: 'EMPLOYEE' },
            userId: user.id,
            entityId: unemployment.id,
        },
    });

    // Expenses remain high...
    console.log('   ❌ Job Lost');
    console.log('   ❌ Income drop: $8,000 -> $1,500');
    console.log('   ❌ Expenses: $6,500 (Deficit -$5,000/month)\n');

    // Draining Savings
    await prisma.cashSavings.update({ where: { id: cashSavings.id }, data: { amount: 0 } });
    await prisma.event.create({
        data: {
            timestamp: new Date('2022-07-01T09:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'CASH_SAVINGS',
            beforeValue: { id: cashSavings.id, amount: 15000 },
            afterValue: { id: cashSavings.id, amount: 0 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    // Credit Card Debt begins
    const creditCard = await prisma.liability.create({
        data: { name: 'Credit Card Debt', value: 10000, bsId: balanceSheet.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-08-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: creditCard.name, value: 10000 },
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    // Snapshot Dec 2022 (The Crash)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2022-12-31T23:59:59Z'),
            data: {
                netWorth: 0 + 500000 - 450000 - 10000, // 40000
                totalAssets: 500000,
                totalLiabilities: 460000,
                totalIncome: 1500,
                totalExpenses: 6500
            }
        }
    });

    // ==========================================
    // PHASE 3: THE SPIRAL (2023-2024)
    // Debt accumulating, selling assets at loss
    // ==========================================
    console.log('📆 PHASE 3: THE SPIRAL (2023-2024)');

    // Credit Card Debt Balloons
    await prisma.liability.update({ where: { id: creditCard.id }, data: { value: 35000 } });
    await prisma.event.create({
        data: {
            timestamp: new Date('2023-06-01T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'LIABILITY',
            beforeValue: { name: creditCard.name, value: 10000 },
            afterValue: { name: creditCard.name, value: 35000 },
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    // Forced to sell house (Market downturn, sold at loss or break even after fees)
    // Selling for 460k, paying off 450k mortgage + fees -> Net 0 cash roughly
    await prisma.asset.delete({ where: { id: house.id } });
    await prisma.liability.delete({ where: { id: mortgage.id } });
    await prisma.expense.delete({ where: { id: mortgagePayment.id } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2023-09-01T10:00:00Z'),
            actionType: 'DELETE',
            entityType: 'ASSET',
            beforeValue: { name: house.name, value: 500000 },
            afterValue: Prisma.DbNull,
            userId: user.id,
            entityId: house.id,
        },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2023-09-01T10:00:00Z'),
            actionType: 'DELETE',
            entityType: 'LIABILITY',
            beforeValue: { name: mortgage.name, value: 450000 },
            afterValue: Prisma.DbNull,
            userId: user.id,
            entityId: mortgage.id,
        },
    });

    // Renting now
    const rent = await prisma.expense.create({
        data: { name: 'Rent (Downsized)', amount: 2000, isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2023-09-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'EXPENSE',
            beforeValue: Prisma.DbNull,
            afterValue: { name: rent.name, amount: 2000 },
            userId: user.id,
            entityId: rent.id,
        },
    });

    // Personal Loan to cover debts
    const personalLoan = await prisma.liability.create({
        data: { name: 'Personal Loan', value: 20000, bsId: balanceSheet.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2024-02-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: personalLoan.name, value: 20000 },
            userId: user.id,
            entityId: personalLoan.id,
        },
    });

    // Snapshot Dec 2024 (The Bottom)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2024-12-31T23:59:59Z'),
            data: {
                netWorth: 0 - 35000 - 20000, // -55000
                totalAssets: 0,
                totalLiabilities: 55000,
                totalIncome: 1500,
                totalExpenses: 4000 + 2000 // Lifestyle + Rent = 6000
            }
        }
    });

    console.log('   ❌ House Sold');
    console.log('   ❌ Debt: $55,000 (CC + Personal Loan)');
    console.log('   ❌ Net Worth: -$55,000\n');

    // ==========================================
    // PHASE 4: BROKE (2025)
    // Trying to recover but deep in hole
    // ==========================================
    console.log('📆 PHASE 4: BROKE (2025)');

    // Got a gig job
    const gigJob = await prisma.incomeLine.create({
        data: { name: 'Gig Economy', amount: 2500, type: 'EARNED', quadrant: 'SELF_EMPLOYED', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-03-01T09:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'EARNED',
            beforeValue: Prisma.DbNull,
            afterValue: { name: gigJob.name, amount: 2500, type: 'EARNED', quadrant: 'SELF_EMPLOYED' },
            userId: user.id,
            entityId: gigJob.id,
        },
    });

    // Interest piling up
    await prisma.liability.update({ where: { id: creditCard.id }, data: { value: 45000 } });
    await prisma.event.create({
        data: {
            timestamp: new Date('2025-10-01T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'LIABILITY',
            beforeValue: { name: creditCard.name, value: 35000 },
            afterValue: { name: creditCard.name, value: 45000 },
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    // Snapshot Nov 2025 (Current)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2025-11-20T23:59:59Z'),
            data: {
                netWorth: 0 - 45000 - 20000, // -65000
                totalAssets: 0,
                totalLiabilities: 65000,
                totalIncome: 1500 + 2500, // 4000
                totalExpenses: 6000
            }
        }
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 FINAL BROKE SUMMARY (November 2025)');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('💰 INCOME: $4,000/month (Unemployment + Gig)');
    console.log('📉 LIABILITIES: $65,000 (Credit Cards + Loans)');
    console.log('🎯 NET WORTH: -$65,000 (From +$55k)');

    console.log('\n✅ Broke User Created!');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
