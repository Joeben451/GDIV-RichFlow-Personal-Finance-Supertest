# Point-in-Time Financial Reconstruction - Implementation Guide

**Feature:** Time Machine Event Replay System  
**Implemented:** November 21, 2025  
**Status:** ✅ Complete

---

## Overview

The point-in-time reconstruction system allows users to view their complete financial state for any historical date. The system reconstructs financial data by replaying immutable event logs in chronological order, providing an accurate snapshot of what the user's finances looked like at that specific moment.

---

## Architecture

### Event-Sourcing Pattern

The system uses **Event Sourcing**, where every financial action is logged as an immutable event. These events serve as the source of truth and can be replayed to reconstruct any historical state.

```
User Action → Database Change → Event Logged
                    ↓
              Event Store (Immutable)
                    ↓
         Time Machine Reconstruction
                    ↓
          Historical Snapshot
```

---

## Implementation Details

### 1. Event Logging for Account Creation

**File:** `backend/src/services/auth.service.ts`

When a user registers, the system now logs events for:
- **Income Statement creation** - Tracks the initial empty income statement
- **Cash Savings creation** - Tracks initial cash savings (amount: 0)

```typescript
// Inside createUser transaction:
await tx.event.create({
  data: {
    actionType: ActionType.CREATE,
    entityType: EntityType.INCOME,
    entitySubtype: 'INCOME_STATEMENT',
    beforeValue: null,
    afterValue: JSON.stringify({ id: incomeStatement.id, userId: newUser.id }),
    userId: newUser.id,
    entityId: incomeStatement.id
  }
});
```

### 2. Point-in-Time Reconstruction Logic

**File:** `backend/src/services/analysis.service.ts`

The reconstruction system consists of several key functions:

#### `reconstructFinancialStateAtDate(userId, targetDate)`
- Queries all events up to the target date
- Sorts events chronologically (oldest first)
- Replays each event to build the financial state

#### Event Handler Functions
- `handleAssetEvent()` - Processes asset CREATE/UPDATE/DELETE events
- `handleLiabilityEvent()` - Processes liability events
- `handleIncomeEvent()` - Processes income line events
- `handleExpenseEvent()` - Processes expense events
- `handleCashSavingsEvent()` - Processes cash savings events

#### `calculateSnapshotFromState(state, targetDate)`
- Takes the reconstructed state
- Calculates all financial metrics (net worth, cashflow, ratios)
- Returns formatted snapshot response

### 3. Updated getFinancialSnapshot Function

The main API function now intelligently decides whether to:
- **Return current state** (if no date or future date provided)
- **Reconstruct historical state** (if past date provided)

```typescript
export const getFinancialSnapshot = async (userId: number, date?: string) => {
  if (!date) {
    return await getCurrentFinancialSnapshot(userId);
  }

  const targetDate = new Date(date);
  const now = new Date();

  if (targetDate >= now) {
    return await getCurrentFinancialSnapshot(userId);
  }

  // Historical reconstruction
  const state = await reconstructFinancialStateAtDate(userId, targetDate);
  return calculateSnapshotFromState(state, targetDate);
};
```

---

## How It Works: Step-by-Step Example

### Scenario: View Financial State One Week After Registration

1. **User Registration (Day 0)**
   ```
   Events Created:
   - CREATE INCOME_STATEMENT (id: 1)
   - CREATE CASH_SAVINGS (id: 1, amount: 0)
   ```

2. **User Adds Income (Day 2)**
   ```
   Event Created:
   - CREATE INCOME (id: 1, name: "Salary", amount: 5000, type: "EARNED")
   ```

3. **User Adds Expense (Day 4)**
   ```
   Event Created:
   - CREATE EXPENSE (id: 1, name: "Rent", amount: 1500)
   ```

4. **User Adds Asset (Day 6)**
   ```
   Event Created:
   - CREATE ASSET (id: 1, name: "Car", value: 20000)
   ```

5. **User Requests Snapshot for Day 7**
   ```
   API Call: GET /api/analysis/snapshot?date=2025-11-28
   
   System Process:
   1. Query events where timestamp <= 2025-11-28
   2. Sort events: [Day 0, Day 2, Day 4, Day 6]
   3. Replay events:
      - Start with empty state
      - Add cash savings (0)
      - Add income line (Salary: 5000)
      - Add expense (Rent: 1500)
      - Add asset (Car: 20000)
   4. Calculate snapshot:
      - Total Income: $5,000
      - Total Expenses: $1,500
      - Net Cashflow: $3,500
      - Total Assets: $20,000
      - Net Worth: $20,000
   ```

---

## Event Structure

Each event contains:

```typescript
{
  id: number,
  timestamp: Date,           // When the action occurred
  actionType: string,        // CREATE, UPDATE, DELETE
  entityType: string,        // INCOME, EXPENSE, ASSET, LIABILITY, CASH_SAVINGS
  entitySubtype: string?,    // e.g., "EARNED", "PASSIVE", "INCOME_STATEMENT"
  beforeValue: string?,      // JSON of state before action
  afterValue: string?,       // JSON of state after action
  userId: number,
  entityId: number           // ID of affected entity
}
```

---

## Financial State Reconstruction

The `FinancialState` interface holds the reconstructed state:

```typescript
interface FinancialState {
  assets: Map<number, { id, name, value }>;
  liabilities: Map<number, { id, name, value }>;
  incomeLines: Map<number, { id, name, amount, type, quadrant }>;
  expenses: Map<number, { id, name, amount }>;
  cashSavings: number;
}
```

Maps are used for O(1) lookups during event replay, ensuring efficient reconstruction even with thousands of events.

---

## API Usage

### Get Current Financial Snapshot
```http
GET /api/analysis/snapshot
Authorization: Bearer <token>
```

### Get Historical Financial Snapshot
```http
GET /api/analysis/snapshot?date=2025-11-14
Authorization: Bearer <token>
```

**Date Format:** YYYY-MM-DD

---

## Performance Considerations

1. **Event Limit:** Currently set to 100,000 events per reconstruction
2. **Sorting:** Events are sorted in-memory (consider indexing for very large datasets)
3. **Caching:** Future optimization could cache reconstructed states for frequently accessed dates
4. **Incremental Replay:** For very large event logs, consider incremental snapshots

---

## Event Logging Coverage

| Action | Events Logged | Status |
|--------|---------------|--------|
| User Registration | ✅ Yes | Complete |
| Income Creation | ✅ Yes | Complete |
| Income Update | ✅ Yes | Complete |
| Income Deletion | ✅ Yes | Complete |
| Expense Creation | ✅ Yes | Complete |
| Expense Update | ✅ Yes | Complete |
| Expense Deletion | ✅ Yes | Complete |
| Asset Creation | ✅ Yes | Complete |
| Asset Update | ✅ Yes | Complete |
| Asset Deletion | ✅ Yes | Complete |
| Liability Creation | ✅ Yes | Complete |
| Liability Update | ✅ Yes | Complete |
| Liability Deletion | ✅ Yes | Complete |
| Cash Savings Update | ✅ Yes | Complete |

---

## Benefits

1. **Complete Audit Trail** - Every financial change is permanently recorded
2. **Time Travel** - View finances at any historical date
3. **Data Recovery** - Events can never be lost or modified
4. **Debugging** - Track exactly when and how data changed
5. **Compliance** - Full financial history for auditing

---

## Future Enhancements

- [ ] Add snapshot caching for improved performance
- [ ] Implement incremental reconstruction from cached snapshots
- [ ] Add event compression for long-term storage
- [ ] Create event visualization timeline in frontend
- [ ] Add bulk event replay for migration scenarios
- [ ] Implement event compaction/archival for old data

---

## Testing Recommendations

1. **Create a new user account** - Verify events are logged
2. **Add financial data over multiple days** - Create income, expenses, assets
3. **Request historical snapshots** - Test various dates
4. **Verify reconstruction accuracy** - Compare with expected calculations
5. **Test edge cases** - Empty states, future dates, very old dates

---

## Related Files

- `backend/src/services/analysis.service.ts` - Main reconstruction logic
- `backend/src/services/auth.service.ts` - Account creation event logging
- `backend/src/services/event.service.ts` - Event creation and querying
- `backend/src/types/event.types.ts` - Event type definitions
- `backend/prisma/schema.prisma` - Event model schema

