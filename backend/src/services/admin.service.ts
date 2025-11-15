import prisma from '../config/database.config';

/**
 * Get all users from the database
 * @returns Array of users with their details
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Get a single user by ID
 * @param userId - The ID of the user to fetch
 * @returns User details
 */
export async function getUserById(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Delete a user by ID
 * @param userId - The ID of the user to delete
 */
export async function deleteUserById(userId: number) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

/**
 * Get user's financial data including balance sheet, income, and expenses
 * @param userId - The ID of the user
 * @returns User's complete financial information
 */
export async function getUserFinancialData(userId: number) {
  try {
    console.log('Fetching financial data for user:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        BalanceSheet: {
          include: {
            Asset: true,
            Liability: true,
          },
        },
        IncomeStatement: {
          include: {
            Expense: true,
            IncomeLine: true,
          },
        },
        CashSavings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('User found:', user.name);
    console.log('Balance Sheet:', user.BalanceSheet ? 'exists' : 'null');
    console.log('Income Statement:', user.IncomeStatement ? 'exists' : 'null');
    console.log('Income Lines:', user.IncomeStatement?.IncomeLine?.length || 0);
    console.log('Expenses:', user.IncomeStatement?.Expense?.length || 0);
    console.log('Cash Savings:', user.CashSavings ? user.CashSavings.amount : 'null');
    console.log('Assets count:', user.BalanceSheet?.Asset?.length || 0);
    console.log('Liabilities count:', user.BalanceSheet?.Liability?.length || 0);

    const result = {
      user: {
        id: user.id,
        firstName: user.name.split(' ')[0] || user.name,
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      balanceSheet: user.BalanceSheet ? {
        ...user.BalanceSheet,
        assets: user.BalanceSheet.Asset || [],
        liabilities: user.BalanceSheet.Liability || [],
      } : null,
      incomeStatement: user.IncomeStatement ? {
        ...user.IncomeStatement,
        expenses: user.IncomeStatement.Expense || [],
      } : null,
      cashSavings: user.CashSavings,
      income: user.IncomeStatement?.IncomeLine || [],
    };

    console.log('Returning result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error fetching user financial data:', error);
    throw new Error('Failed to fetch user financial data');
  }
}
