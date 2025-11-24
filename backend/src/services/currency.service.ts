import prisma from '../config/database.config';
import { logUserEvent } from './event.service';
import { ActionType } from '../types/event.types';

/**
 * Get all available currencies
 */
export const getAllCurrencies = async () => {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: {
        cur_name: 'asc',
      },
    });
    return currencies;
  } catch (error) {
    throw new Error('Failed to fetch currencies');
  }
};

/**
 * Get a specific currency by ID
 */
export const getCurrencyById = async (currencyId: number) => {
  try {
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
    });
    return currency;
  } catch (error) {
    throw new Error('Failed to fetch currency');
  }
};

/**
 * Update user's preferred currency
 */
export const updateUserCurrency = async (userId: number, currencyId: number) => {
  try {
    // First, verify that the currency exists
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
    });

    if (!currency) {
      throw new Error('Currency not found');
    }

    // Get current user state for "beforeValue"
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { PreferredCurrency: true }
    });

    // Update the user's preferred currency
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { preferredCurrencyId: currencyId },
      include: {
        PreferredCurrency: true,
      },
    });

    // Log the event
    if (currentUser) {
      await logUserEvent(
        ActionType.UPDATE,
        userId,
        userId, // entityId is the userId for User events
        { 
          preferredCurrencyId: currentUser.preferredCurrencyId, 
          currencyCode: currentUser.PreferredCurrency?.cur_symbol,
          currencyName: currentUser.PreferredCurrency?.cur_name
        }, // Before
        { 
          preferredCurrencyId: updatedUser.preferredCurrencyId, 
          currencyCode: updatedUser.PreferredCurrency.cur_symbol,
          currencyName: updatedUser.PreferredCurrency.cur_name
        }  // After
      );
    }

    return updatedUser;
  } catch (error) {
    if (error instanceof Error && error.message === 'Currency not found') {
      throw error;
    }
    throw new Error('Failed to update user currency preference');
  }
};

/**
 * Get user's preferred currency
 */
export const getUserCurrency = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        PreferredCurrency: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.PreferredCurrency;
  } catch (error) {
    throw new Error('Failed to fetch user currency preference');
  }
};
