import prisma from '../config/database.config.js';
import { Asset, Liability } from '@prisma/client';
import { logAssetEvent, logLiabilityEvent, TransactionClient } from './event.service.js';
import { ActionType } from '../types/event.types.js';

interface AssetData {
  name: string;
  value: number;
}

interface LiabilityData {
  name: string;
  value: number;
}

/**
 * Get balance sheet with assets and liabilities for a user
 */
export async function getBalanceSheet(userId: number) {
  const balanceSheet = await prisma.balanceSheet.findFirst({
    where: { userId },
    include: {
      Asset: true,
      Liability: true
    }
  });

  return balanceSheet;
}

/**
 * Create balance sheet for a user
 */
export async function createBalanceSheet(userId: number) {
  const existingBalanceSheet = await prisma.balanceSheet.findFirst({
    where: { userId }
  });

  if (existingBalanceSheet) {
    return existingBalanceSheet;
  }

  return await prisma.balanceSheet.create({
    data: {
      userId,
      Asset: {
        create: []
      },
      Liability: {
        create: []
      }
    },
    include: {
      Asset: true,
      Liability: true
    }
  });
}

/**
 * Get all assets for a user
 */
export async function getAssets(userId: number) {
  const balanceSheet = await prisma.balanceSheet.findFirst({
    where: { userId },
    include: {
      Asset: true
    }
  });

  if (!balanceSheet) {
    return [];
  }

  return balanceSheet.Asset;
}

/**
 * Add a new asset for a user
 * Uses transaction to ensure atomicity between entity creation and event logging
 */
export async function addAsset(userId: number, data: AssetData): Promise<Asset> {
  return await prisma.$transaction(async (tx) => {
    // Get or create balance sheet
    let balanceSheet = await tx.balanceSheet.findFirst({
      where: { userId }
    });

    if (!balanceSheet) {
      balanceSheet = await tx.balanceSheet.create({
        data: { userId }
      });
    }

    // Create asset
    const newAsset = await tx.asset.create({
      data: {
        name: data.name,
        value: data.value,
        bsId: balanceSheet.id
      }
    });

    // Log the CREATE event within the same transaction
    await logAssetEvent(
      ActionType.CREATE,
      userId,
      newAsset.id,
      undefined,
      {
        name: newAsset.name,
        value: newAsset.value
      },
      tx as unknown as TransactionClient
    );

    return newAsset;
  });
}

/**
 * Update an asset
 * Verifies ownership before update
 * Uses transaction to ensure atomicity between entity update and event logging
 */
export async function updateAsset(userId: number, assetId: number, data: AssetData): Promise<Asset> {
  // First verify ownership (outside transaction for fast-fail)
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      BalanceSheet: {
        userId
      }
    }
  });

  if (!asset) {
    throw new Error('Asset not found or unauthorized');
  }

  // Capture before state
  const beforeValue = {
    name: asset.name,
    value: asset.value
  };

  return await prisma.$transaction(async (tx) => {
    // Update asset
    const updatedAsset = await tx.asset.update({
      where: { id: assetId },
      data: {
        name: data.name,
        value: data.value
      }
    });

    // Log the UPDATE event within the same transaction
    await logAssetEvent(
      ActionType.UPDATE,
      userId,
      assetId,
      beforeValue,
      {
        name: updatedAsset.name,
        value: updatedAsset.value
      },
      tx as unknown as TransactionClient
    );

    return updatedAsset;
  });
}

/**
 * Delete an asset
 * Verifies ownership before deletion
 * Uses transaction to ensure atomicity between entity deletion and event logging
 */
export async function deleteAsset(userId: number, assetId: number): Promise<Asset> {
  // First verify ownership (outside transaction for fast-fail)
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      BalanceSheet: {
        userId
      }
    }
  });

  if (!asset) {
    throw new Error('Asset not found or unauthorized');
  }

  // Capture before state for event log
  const beforeValue = {
    name: asset.name,
    value: asset.value
  };

  return await prisma.$transaction(async (tx) => {
    // Delete asset
    const deletedAsset = await tx.asset.delete({
      where: { id: assetId }
    });

    // Log the DELETE event within the same transaction
    await logAssetEvent(
      ActionType.DELETE,
      userId,
      assetId,
      beforeValue,
      undefined,
      tx as unknown as TransactionClient
    );

    return deletedAsset;
  });
}

/**
 * Get all liabilities for a user
 */
export async function getLiabilities(userId: number) {
  const balanceSheet = await prisma.balanceSheet.findFirst({
    where: { userId },
    include: {
      Liability: true
    }
  });

  if (!balanceSheet) {
    return [];
  }

  return balanceSheet.Liability;
}

/**
 * Add a new liability for a user
 * Uses transaction to ensure atomicity between entity creation and event logging
 */
export async function addLiability(userId: number, data: LiabilityData): Promise<Liability> {
  return await prisma.$transaction(async (tx) => {
    // Get or create balance sheet
    let balanceSheet = await tx.balanceSheet.findFirst({
      where: { userId }
    });

    if (!balanceSheet) {
      balanceSheet = await tx.balanceSheet.create({
        data: { userId }
      });
    }

    // Create liability
    const newLiability = await tx.liability.create({
      data: {
        name: data.name,
        value: data.value,
        bsId: balanceSheet.id
      }
    });

    // Log the CREATE event within the same transaction
    await logLiabilityEvent(
      ActionType.CREATE,
      userId,
      newLiability.id,
      undefined,
      {
        name: newLiability.name,
        value: newLiability.value
      },
      tx as unknown as TransactionClient
    );

    return newLiability;
  });
}

/**
 * Update a liability
 * Verifies ownership before update
 * Uses transaction to ensure atomicity between entity update and event logging
 */
export async function updateLiability(userId: number, liabilityId: number, data: LiabilityData): Promise<Liability> {
  // First verify ownership (outside transaction for fast-fail)
  const liability = await prisma.liability.findFirst({
    where: {
      id: liabilityId,
      BalanceSheet: {
        userId
      }
    }
  });

  if (!liability) {
    throw new Error('Liability not found or unauthorized');
  }

  // Capture before state
  const beforeValue = {
    name: liability.name,
    value: liability.value
  };

  return await prisma.$transaction(async (tx) => {
    // Update liability
    const updatedLiability = await tx.liability.update({
      where: { id: liabilityId },
      data: {
        name: data.name,
        value: data.value
      }
    });

    // Log the UPDATE event within the same transaction
    await logLiabilityEvent(
      ActionType.UPDATE,
      userId,
      liabilityId,
      beforeValue,
      {
        name: updatedLiability.name,
        value: updatedLiability.value
      },
      tx as unknown as TransactionClient
    );

    return updatedLiability;
  });
}

/**
 * Delete a liability
 * Verifies ownership before deletion
 * Uses transaction to ensure atomicity between entity deletion and event logging
 */
export async function deleteLiability(userId: number, liabilityId: number): Promise<Liability> {
  // First verify ownership (outside transaction for fast-fail)
  const liability = await prisma.liability.findFirst({
    where: {
      id: liabilityId,
      BalanceSheet: {
        userId
      }
    }
  });

  if (!liability) {
    throw new Error('Liability not found or unauthorized');
  }

  // Capture before state for event log
  const beforeValue = {
    name: liability.name,
    value: liability.value
  };

  return await prisma.$transaction(async (tx) => {
    // Delete liability
    const deletedLiability = await tx.liability.delete({
      where: { id: liabilityId }
    });

    // Log the DELETE event within the same transaction
    await logLiabilityEvent(
      ActionType.DELETE,
      userId,
      liabilityId,
      beforeValue,
      undefined,
      tx as unknown as TransactionClient
    );

    return deletedLiability;
  });
}
