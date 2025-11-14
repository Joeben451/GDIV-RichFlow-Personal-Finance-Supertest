import prisma from '../config/database.config';

interface ExpenseData {
  name: string;
  amount: number;
}

/**
 * Get all expenses for a user
 */
export async function getExpenses(userId: number) {
  // First ensure user has an income statement
  const incomeStatement = await prisma.incomeStatement.findFirst({
    where: { userId },
    include: {
      Expense: true
    }
  });

  if (!incomeStatement) {
    // Create income statement if it doesn't exist
    const newStatement = await prisma.incomeStatement.create({
      data: {
        userId,
        Expense: {
          create: [] // Start with empty expenses
        }
      },
      include: {
        Expense: true
      }
    });
    return newStatement.Expense;
  }

  return incomeStatement.Expense;
}

/**
 * Add a new expense for a user
 */
export async function addExpense(userId: number, data: ExpenseData) {
  // Get or create income statement
  let incomeStatement = await prisma.incomeStatement.findFirst({
    where: { userId }
  });

  if (!incomeStatement) {
    incomeStatement = await prisma.incomeStatement.create({
      data: { userId }
    });
  }

  try {
    // Create expense with proper type casting for amount
    const newExpense = await prisma.expense.create({
      data: {
        name: data.name,
        amount: parseFloat(data.amount.toString()), // Ensure amount is a float
        isId: incomeStatement.id // Link to income statement
      }
    });
    
    return newExpense;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
}

/**
 * Update an expense
 * Verifies ownership before update
 */
export async function updateExpense(userId: number, expenseId: number, data: ExpenseData) {
  // First verify ownership
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      IncomeStatement: {
        userId
      }
    }
  });

  if (!expense) {
    return null;
  }

  // Update the expense
  return await prisma.expense.update({
    where: { id: expenseId },
    data: {
      name: data.name,
      amount: data.amount
    }
  });
}

/**
 * Delete an expense
 * Verifies ownership before deletion
 */
export async function deleteExpense(userId: number, expenseId: number) {
  // First verify ownership
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      IncomeStatement: {
        userId
      }
    }
  });

  if (!expense) {
    return null;
  }

  // Delete the expense
  await prisma.expense.delete({
    where: { id: expenseId }
  });

  return true;
}