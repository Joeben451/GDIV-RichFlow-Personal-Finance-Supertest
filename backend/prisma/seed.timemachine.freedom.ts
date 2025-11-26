import { Prisma, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.utils';

const prisma = new PrismaClient();

/**
 * Time Machine Freedom User Seed
 * Creates a user with a "Rags to Riches" financial history from Jan 1, 2020 to Nov 2025.
 * Narrative: Struggling with debt -> Career Pivot -> Aggressive Repayment -> Investing -> Financial Freedom.
 */

const TEST_USER = {
    name: 'freedom_user',
    email: 'freedom@test.com',
    password: 'Freedom2025!',
    isAdmin: false,
    preferredCurrencyId: 1, // USD
    createdAt: new Date('2020-01-01T10:00:00Z'),
};

async function main() {
    console.log('🕐 Starting Time Machine "Financial Freedom" Seed...');
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

    console.log('🗑️  Cleaned up existing freedom user data\n');

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
    const cashSavings = await prisma.cashSavings.create({ data: { userId: user.id, amount: 200 } }); // Started with almost nothing
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
            afterValue: { id: cashSavings.id, userId: user.id, amount: 200 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    // ==========================================
    // PHASE 1: THE STRUGGLE (2020-2021)
    // Low income, high debt, living paycheck to paycheck
    // ==========================================
    console.log('📆 PHASE 1: THE STRUGGLE (2020-2021)');

    // 1. Low Paying Job
    const retailJob = await prisma.incomeLine.create({
        data: {
            name: 'Retail Job',
            amount: 2200,
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
            afterValue: { name: retailJob.name, amount: 2200, type: 'EARNED', quadrant: 'EMPLOYEE' },
            userId: user.id,
            entityId: retailJob.id,
        },
    });

    // 2. High Expenses
    const rent = await prisma.expense.create({
        data: { name: 'Rent (Shared)', amount: 800, isId: incomeStatement.id },
    });
    const livingExpenses = await prisma.expense.create({
        data: { name: 'Living Expenses', amount: 1200, isId: incomeStatement.id },
    });
    const loanPayment = await prisma.expense.create({
        data: { name: 'Min Loan Payments', amount: 300, isId: incomeStatement.id },
    });

    // Log expenses (simplified batch logging for brevity in code, but separate events in DB)
    const expenses = [rent, livingExpenses, loanPayment];
    for (const exp of expenses) {
        await prisma.event.create({
            data: {
                timestamp: new Date('2020-01-10T10:00:00Z'),
                actionType: 'CREATE',
                entityType: 'EXPENSE',
                beforeValue: Prisma.DbNull,
                afterValue: { name: exp.name, amount: exp.amount },
                userId: user.id,
                entityId: exp.id,
            },
        });
    }

    // 3. Liabilities (Debt)
    const studentLoan = await prisma.liability.create({
        data: { name: 'Student Loans', value: 25000, bsId: balanceSheet.id },
    });
    const creditCard = await prisma.liability.create({
        data: { name: 'Credit Card Debt', value: 4000, bsId: balanceSheet.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-01-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: studentLoan.name, value: 25000 },
            userId: user.id,
            entityId: studentLoan.id,
        },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-01-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: creditCard.name, value: 4000 },
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    console.log('   ❌ Net Worth: -$28,800');
    console.log('   ❌ Cashflow: -$100/month (Deficit)');
    console.log('   ❌ Credit Card Debt increasing...\n');

    // Snapshot Jan 2020 (The Struggle)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2020-01-31T23:59:59Z'),
            data: {
                netWorth: 200 - 25000 - 4000, // Cash - Student Loan - CC = -28800
                totalAssets: 200,
                totalLiabilities: 29000,
                totalIncome: 2200,
                totalExpenses: 800 + 1200 + 300 // 2300 (Deficit)
            }
        }
    });

    // Late 2020 - Debt Increases due to deficit
    await prisma.liability.update({
        where: { id: creditCard.id },
        data: { value: 5500 },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2020-12-01T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'LIABILITY',
            beforeValue: { name: creditCard.name, value: 4000 },
            afterValue: { name: creditCard.name, value: 5500 },
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    // ==========================================
    // PHASE 2: THE TURNING POINT (2022)
    // Career switch, income doubles, aggressive payoff
    // ==========================================
    console.log('📆 PHASE 2: THE TURNING POINT (2022)');

    // New Job
    await prisma.incomeLine.update({
        where: { id: retailJob.id },
        data: { name: 'Junior Tech Support', amount: 4000 },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-02-01T09:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'INCOME',
            entitySubtype: 'EARNED',
            beforeValue: { name: 'Retail Job', amount: 2200, type: 'EARNED', quadrant: 'EMPLOYEE' },
            afterValue: { name: 'Junior Tech Support', amount: 4000, type: 'EARNED', quadrant: 'EMPLOYEE' },
            userId: user.id,
            entityId: retailJob.id,
        },
    });

    // Cut Expenses (Moved to cheaper place/budgeting)
    await prisma.expense.update({ where: { id: livingExpenses.id }, data: { amount: 1000 } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-03-01T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'EXPENSE',
            beforeValue: { name: 'Living Expenses', amount: 1200 },
            afterValue: { name: 'Living Expenses', amount: 1000 },
            userId: user.id,
            entityId: livingExpenses.id,
        },
    });

    // Aggressive Debt Payoff - Paid off Credit Card
    await prisma.liability.delete({ where: { id: creditCard.id } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-08-15T10:00:00Z'),
            actionType: 'DELETE',
            entityType: 'LIABILITY',
            beforeValue: { name: creditCard.name, value: 5500 },
            afterValue: Prisma.DbNull,
            userId: user.id,
            entityId: creditCard.id,
        },
    });

    // Savings start to grow
    await prisma.cashSavings.update({ where: { id: cashSavings.id }, data: { amount: 5000 } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2022-12-30T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'CASH_SAVINGS',
            beforeValue: { id: cashSavings.id, amount: 200 },
            afterValue: { id: cashSavings.id, amount: 5000 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    console.log('   ✅ Income doubled: $4,000');
    console.log('   ✅ Credit Card Debt Eliminated');
    console.log('   ✅ Emergency Fund: $5,000\n');

    // Snapshot Dec 2022 (Turning Point)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2022-12-31T23:59:59Z'),
            data: {
                netWorth: 5000 - 25000, // Cash - Student Loan = -20000
                totalAssets: 5000,
                totalLiabilities: 25000,
                totalIncome: 4000,
                totalExpenses: 800 + 1000 + 300 // 2100 (Surplus!)
            }
        }
    });

    // ==========================================
    // PHASE 3: ACCUMULATION (2023-2024)
    // Promotion, Investing, Side Hustle
    // ==========================================
    console.log('📆 PHASE 3: ACCUMULATION (2023-2024)');

    // Promotion
    await prisma.incomeLine.update({
        where: { id: retailJob.id },
        data: { name: 'SysAdmin', amount: 6000 },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2023-06-01T09:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'INCOME',
            entitySubtype: 'EARNED',
            beforeValue: { name: 'Junior Tech Support', amount: 4000, type: 'EARNED', quadrant: 'EMPLOYEE' },
            afterValue: { name: 'SysAdmin', amount: 6000, type: 'EARNED', quadrant: 'EMPLOYEE' },
            userId: user.id,
            entityId: retailJob.id,
        },
    });

    // Start Investing - Index Funds
    const indexFunds = await prisma.asset.create({
        data: { name: 'Index Funds (S&P 500)', value: 10000, bsId: balanceSheet.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2023-07-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'ASSET',
            beforeValue: Prisma.DbNull,
            afterValue: { name: indexFunds.name, value: 10000 },
            userId: user.id,
            entityId: indexFunds.id,
        },
    });

    // Side Hustle
    const sideHustle = await prisma.incomeLine.create({
        data: { name: 'Tech Consulting', amount: 1500, type: 'EARNED', quadrant: 'SELF_EMPLOYED', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2024-01-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'EARNED',
            beforeValue: Prisma.DbNull,
            afterValue: { name: sideHustle.name, amount: 1500, type: 'EARNED', quadrant: 'SELF_EMPLOYED' },
            userId: user.id,
            entityId: sideHustle.id,
        },
    });

    // Pay off Student Loan
    await prisma.liability.delete({ where: { id: studentLoan.id } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2024-06-01T10:00:00Z'),
            actionType: 'DELETE',
            entityType: 'LIABILITY',
            beforeValue: { name: studentLoan.name, value: 25000 },
            afterValue: Prisma.DbNull,
            userId: user.id,
            entityId: studentLoan.id,
        },
    });

    // Portfolio Growth
    await prisma.asset.update({ where: { id: indexFunds.id }, data: { value: 45000 } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2024-12-01T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'ASSET',
            beforeValue: { name: indexFunds.name, value: 10000 },
            afterValue: { name: indexFunds.name, value: 45000 },
            userId: user.id,
            entityId: indexFunds.id,
        },
    });

    console.log('   ✅ Debt Free!');
    console.log('   ✅ Income: $7,500/month');
    console.log('   ✅ Portfolio: $45,000\n');

    // Snapshot Dec 2024 (Accumulation)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2024-12-31T23:59:59Z'),
            data: {
                netWorth: 5000 + 45000, // Cash + Index Funds = 50000 (Debt Free!)
                totalAssets: 50000,
                totalLiabilities: 0,
                totalIncome: 6000 + 1500, // 7500
                totalExpenses: 2100 // Assumed stable
            }
        }
    });

    // ==========================================
    // PHASE 4: FINANCIAL FREEDOM (2025)
    // Major Asset Purchase, Passive Income > Expenses
    // ==========================================
    console.log('📆 PHASE 4: FINANCIAL FREEDOM (2025)');

    // Buy Rental Property (Leverage)
    const rentalProp = await prisma.asset.create({
        data: { name: 'Duplex Rental', value: 300000, bsId: balanceSheet.id },
    });
    const mortgage = await prisma.liability.create({
        data: { name: 'Mortgage', value: 240000, bsId: balanceSheet.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-02-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'ASSET',
            beforeValue: Prisma.DbNull,
            afterValue: { name: rentalProp.name, value: 300000 },
            userId: user.id,
            entityId: rentalProp.id,
        },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-02-15T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'LIABILITY',
            beforeValue: Prisma.DbNull,
            afterValue: { name: mortgage.name, value: 240000 },
            userId: user.id,
            entityId: mortgage.id,
        },
    });

    // Rental Income
    const rentalIncome = await prisma.incomeLine.create({
        data: { name: 'Rental Income (Net)', amount: 2500, type: 'PASSIVE', quadrant: 'INVESTOR', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-03-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'PASSIVE',
            beforeValue: Prisma.DbNull,
            afterValue: { name: rentalIncome.name, amount: 2500, type: 'PASSIVE', quadrant: 'INVESTOR' },
            userId: user.id,
            entityId: rentalIncome.id,
        },
    });

    // Dividend Income
    const dividends = await prisma.incomeLine.create({
        data: { name: 'Dividends', amount: 300, type: 'PORTFOLIO', quadrant: 'INVESTOR', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-04-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'PORTFOLIO',
            beforeValue: Prisma.DbNull,
            afterValue: { name: dividends.name, amount: 300, type: 'PORTFOLIO', quadrant: 'INVESTOR' },
            userId: user.id,
            entityId: dividends.id,
        },
    });

    // Digital Product (Passive)
    const digitalProduct = await prisma.incomeLine.create({
        data: { name: 'Course Sales', amount: 2000, type: 'PASSIVE', quadrant: 'BUSINESS_OWNER', isId: incomeStatement.id },
    });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-08-01T10:00:00Z'),
            actionType: 'CREATE',
            entityType: 'INCOME',
            entitySubtype: 'PASSIVE',
            beforeValue: Prisma.DbNull,
            afterValue: { name: digitalProduct.name, amount: 2000, type: 'PASSIVE', quadrant: 'BUSINESS_OWNER' },
            userId: user.id,
            entityId: digitalProduct.id,
        },
    });

    // Final Portfolio Update
    await prisma.asset.update({ where: { id: indexFunds.id }, data: { value: 85000 } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-11-20T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'ASSET',
            beforeValue: { name: indexFunds.name, value: 45000 },
            afterValue: { name: indexFunds.name, value: 85000 },
            userId: user.id,
            entityId: indexFunds.id,
        },
    });

    await prisma.cashSavings.update({ where: { id: cashSavings.id }, data: { amount: 60000 } });

    await prisma.event.create({
        data: {
            timestamp: new Date('2025-11-20T10:00:00Z'),
            actionType: 'UPDATE',
            entityType: 'CASH_SAVINGS',
            beforeValue: { id: cashSavings.id, amount: 5000 },
            afterValue: { id: cashSavings.id, amount: 60000 },
            userId: user.id,
            entityId: cashSavings.id,
        },
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 FINAL FREEDOM SUMMARY (November 2025)');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('💰 INCOME:');
    console.log('   • Job: $6,000 (Active)');
    console.log('   • Consulting: $1,500 (Active)');
    console.log('   • Rental: $2,500 (Passive)');
    console.log('   • Course: $2,000 (Passive)');
    console.log('   • Dividends: $300 (Passive)');
    console.log('   • TOTAL: $12,300/month');
    console.log('   • PASSIVE TOTAL: $4,800/month (Covers Expenses!)');

    console.log('📈 ASSETS: $445,000 (Real Estate + Stocks + Cash)');
    console.log('📉 LIABILITIES: $240,000 (Mortgage)');
    console.log('🎯 NET WORTH: $205,000 (From -$28k)');

    // Snapshot Nov 2025 (Freedom)
    await prisma.financialSnapshot.create({
        data: {
            userId: user.id,
            date: new Date('2025-11-30T23:59:59Z'),
            data: {
                netWorth: 60000 + 85000 + 300000 - 240000, // Cash + Stocks + Rental - Mortgage = 205000
                totalAssets: 445000,
                totalLiabilities: 240000,
                totalIncome: 6000 + 1500 + 2500 + 2000 + 300, // 12300
                totalExpenses: 2100 // Assumed stable base expenses
            }
        }
    });

    console.log('\n✅ Freedom User Created!');
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
