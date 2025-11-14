import prisma from '../config/database.config';

interface IncomeLineData {
  name: string;
  amount: number;
  type: string;
}

/**
 * Get all income lines for a user
 */
export async function getIncomeLines(userId: number) {
  // First ensure user has an income statement
  const incomeStatement = await prisma.incomeStatement.findFirst({
    where: { userId },
    include: {
      IncomeLine: true
    }
  });

  if (!incomeStatement) {
    // Create income statement if it doesn't exist
    const newStatement = await prisma.incomeStatement.create({
      data: {
        userId,
        IncomeLine: {
          create: [] // Start with empty income lines
        }
      },
      include: {
        IncomeLine: true
      }
    });
    return newStatement.IncomeLine;
  }

  return incomeStatement.IncomeLine;
}

/**
 * Add a new income line for a user
 */
export async function addIncomeLine(userId: number, data: IncomeLineData) {
  // Get or create income statement
  let incomeStatement = await prisma.incomeStatement.findFirst({
    where: { userId }
  });

  if (!incomeStatement) {
    incomeStatement = await prisma.incomeStatement.create({
      data: { userId }
    });
  }

  // Create income line
  return await prisma.incomeLine.create({
    data: {
      name: data.name,
      amount: data.amount,
      type: data.type,
      isId: incomeStatement.id // Link to income statement
    }
  });
}

/**
 * Update an income line
 * Verifies ownership before update
 */
export async function updateIncomeLine(userId: number, incomeLineId: number, data: IncomeLineData) {
  // First verify ownership
  const incomeLine = await prisma.incomeLine.findFirst({
    where: {
      id: incomeLineId,
      IncomeStatement: {
        userId
      }
    }
  });

  if (!incomeLine) {
    return null;
  }

  // Update the income line
  return await prisma.incomeLine.update({
    where: { id: incomeLineId },
    data: {
      name: data.name,
      amount: data.amount,
      type: data.type
    }
  });
}

/**
 * Delete an income line
 * Verifies ownership before deletion
 */
export async function deleteIncomeLine(userId: number, incomeLineId: number) {
  // First verify ownership
  const incomeLine = await prisma.incomeLine.findFirst({
    where: {
      id: incomeLineId,
      IncomeStatement: {
        userId
      }
    }
  });

  if (!incomeLine) {
    return null;
  }

  // Delete the income line
  await prisma.incomeLine.delete({
    where: { id: incomeLineId }
  });

  return true;
}