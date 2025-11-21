export type IncomeQuadrant = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'INVESTOR';

const normalize = (value?: string | null) => (value || '').trim().toUpperCase();

export const EARNED_QUADRANTS: IncomeQuadrant[] = ['EMPLOYEE', 'SELF_EMPLOYED'];

const TYPE_TO_QUADRANT: Record<string, IncomeQuadrant> = {
  PASSIVE: 'BUSINESS_OWNER',
  PORTFOLIO: 'INVESTOR'
};

export const createEmptyQuadrantTotals = (): Record<IncomeQuadrant, number> => ({
  EMPLOYEE: 0,
  SELF_EMPLOYED: 0,
  BUSINESS_OWNER: 0,
  INVESTOR: 0
});

export const isEarnedQuadrant = (quadrant?: string | null): quadrant is IncomeQuadrant => {
  const normalizedQuadrant = normalize(quadrant);
  return EARNED_QUADRANTS.includes(normalizedQuadrant as IncomeQuadrant);
};

export const determineIncomeQuadrant = (
  type?: string | null,
  preferredQuadrant?: string | null
): IncomeQuadrant => {
  const normalizedType = normalize(type);

  if (normalizedType === 'EARNED') {
    const normalizedQuadrant = normalize(preferredQuadrant);
    return isEarnedQuadrant(normalizedQuadrant)
      ? (normalizedQuadrant as IncomeQuadrant)
      : 'EMPLOYEE';
  }

  return TYPE_TO_QUADRANT[normalizedType] || 'EMPLOYEE';
};
