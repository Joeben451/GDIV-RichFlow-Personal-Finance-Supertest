
# RichFlow Event Log & Analysis System Documentation

**Project:** RichFlow - Personal Finance Management Application  
**Last Updated:** November 26, 2025  
**Status:** Another Major Feature Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models & Schema](#data-models--schema)
3. [Architecture](#architecture)
4. [Event Log System](#event-log-system)
5. [Analysis System](#analysis-system)
6. [API Endpoints](#api-endpoints)
7. [Backend Implementation](#backend-implementation)
8. [Frontend Implementation](#frontend-implementation)
9. [Data Flow Examples](#data-flow-examples)
10. [Security Considerations](#security-considerations)
11. [Performance Optimizations](#performance-optimizations)
12. [Contributors](#contributors)
13. [Changelog](#changelog)

---

## Overview

This document details the Event Log and Analysis systems in the RichFlow application. These systems work together to provide users with a complete audit trail of their financial activities and powerful analytical tools to track their journey toward financial freedom.

### Key Features

#### Event Log System
- **Immutable Event Logging**: Every financial action is recorded as an immutable event
- **Complete Audit Trail**: Track all changes to income, expenses, assets, liabilities, and cash savings
- **Historical Currency Tracking**: Events preserve the currency context at the time of creation
- **Filtering & Search**: Filter events by type, date range, and search descriptions
- **Entity Type Classification**: Events are categorized by entity type (Income, Expense, Asset, Liability, Cash, User)

#### Analysis System
- **Financial Snapshot**: View current financial state with comprehensive metrics
- **Point-in-Time Reconstruction**: Reconstruct financial state for any historical date using event replay
- **Financial Trajectory**: Track financial progress over time with customizable intervals
- **Comparison Reports**: Compare financial states between two dates
- **Rich Metrics**: Calculate wealth velocity, solvency ratio, freedom gap, passive coverage ratio, and more
- **Income Quadrant Analysis**: Visualize income distribution across Employee, Self-Employed, Business Owner, and Investor categories

---

## Data Models & Schema

### Event Model

**Purpose:** Stores immutable financial action events for audit and reconstruction purposes.

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `timestamp` (DateTime) - When the action occurred
- `actionType` (String) - The type of action: `CREATE`, `UPDATE`, `DELETE`
- `entityType` (String) - The type of entity: `INCOME`, `EXPENSE`, `ASSET`, `LIABILITY`, `CASH_SAVINGS`, `USER`
- `entitySubtype` (String, Optional) - Additional classification (e.g., `EARNED`, `PASSIVE`, `PORTFOLIO` for income)
- `beforeValue` (Json, Optional) - State of the entity before the action
- `afterValue` (Json, Optional) - State of the entity after the action
- `userId` (Int, Foreign Key) - Links to the `User` model
- `entityId` (Int) - ID of the affected entity

**Indexes:**
- `userId` - For efficient user-scoped queries
- `entityType` - For filtering by entity type
- `entityId` - For entity-specific history
- `userId, timestamp` - For chronological reconstruction

---

### FinancialSnapshot Model

**Purpose:** Caches reconstructed financial states at specific points in time for performance optimization.

**Fields:**
- `id` (String, UUID, Primary Key)
- `userId` (Int, Foreign Key) - Links to the `User` model
- `date` (DateTime) - The date of the snapshot
- `data` (Json) - Serialized financial state
- `createdAt` (DateTime) - When the snapshot was created

**Indexes:**
- `userId, date` - For efficient snapshot lookups

---

## Architecture

### Event-Sourcing Pattern

The system uses **Event Sourcing**, where every financial action is logged as an immutable event. These events serve as the source of truth and can be replayed to reconstruct any historical state.

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Event Log Page                                        │ │
│  │   - Filter by type, date, search                       │ │
│  │   - Display event timeline                             │ │
│  │   - Show value changes with currency                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Analysis Page                                         │ │
│  │   - Financial Snapshot Dashboard                       │ │
│  │   - Time Machine Controller                            │ │
│  │   - Comparison Reports                                 │ │
│  │   - Trajectory Visualization Charts                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS (Authenticated API Calls)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       Backend API                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/events, /api/analysis                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers: event.controller, analysis.controller    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services: event.service, analysis.service             │ │
│  │   - Event Logging                                      │ │
│  │   - Pure Reducer Pattern for State Reconstruction      │ │
│  │   - Metrics Calculation                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tables: Event, FinancialSnapshot                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Reducer-Based State Reconstruction

The analysis system uses a **pure reducer pattern** for reconstructing financial state from events:

```typescript
// Event types flow through entity-specific reducers
rootReducer(state, event) → {
  ASSET      → assetReducer(state, event)
  LIABILITY  → liabilityReducer(state, event)
  INCOME     → incomeReducer(state, event)
  EXPENSE    → expenseReducer(state, event)
  CASH_SAVINGS → cashSavingsReducer(state, event)
  USER       → userReducer(state, event)
}
```

---

## Event Log System

### Event Types

| ActionType | Description |
|------------|-------------|
| `CREATE` | A new entity was created |
| `UPDATE` | An existing entity was modified |
| `DELETE` | An entity was removed |

### Entity Types

| EntityType | Description |
|------------|-------------|
| `INCOME` | Income line entries |
| `EXPENSE` | Expense entries |
| `ASSET` | Asset entries |
| `LIABILITY` | Liability entries |
| `CASH_SAVINGS` | Cash savings balance |
| `USER` | User account changes (e.g., currency preference) |

### Income Subtypes

| Subtype | Description |
|---------|-------------|
| `EARNED` | Active income from employment |
| `PORTFOLIO` | Income from investments |
| `PASSIVE` | Passive income streams |

### Event Structure

```typescript
interface Event {
  id: number;
  timestamp: Date;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'CASH_SAVINGS' | 'USER';
  entitySubtype: string | null;
  beforeValue: object | null;
  afterValue: object | null;
  userId: number;
  entityId: number;
}
```

### Immutability Guarantee

Events are **immutable by design**:
- No `UPDATE` or `DELETE` endpoints exist for events
- API routes explicitly block modification attempts with `403 Forbidden` responses
- Events can only be created and read, never modified

---

## Analysis System

### Financial State Model

```typescript
interface FinancialState {
  assets: Map<number, { id: number; name: string; value: number }>;
  liabilities: Map<number, { id: number; name: string; value: number }>;
  incomeLines: Map<number, { id: number; name: string; amount: number; type: string; quadrant?: string }>;
  expenses: Map<number, { id: number; name: string; amount: number }>;
  cashSavings: number;
  currency: { symbol: string; name: string };
}
```

### Key Metrics Calculated

#### Balance Sheet Metrics
- **Total Cash Balance**: Liquid cash savings
- **Total Assets**: Sum of all asset values
- **Total Liabilities**: Sum of all liability values
- **Net Worth**: Total Assets - Total Liabilities + Cash

#### Cashflow Metrics
- **Earned Income**: Total from employment/active work
- **Passive Income**: Total from passive sources
- **Portfolio Income**: Total from investments
- **Total Income**: Sum of all income types
- **Total Expenses**: Sum of all expenses
- **Net Cashflow**: Total Income - Total Expenses

#### RichFlow Metrics
- **Wealth Velocity**: Monthly net worth change (absolute and percentage)
- **Solvency Ratio**: (Total Liabilities / Total Assets with Cash) × 100
- **Freedom Gap**: Total Expenses - (Passive Income + Portfolio Income)

#### Financial Health Metrics
- **Runway**: Cash / Monthly Expenses (months of runway)
- **Asset Efficiency**: ((Passive + Portfolio Income) / Total Assets) × 100
- **Passive Coverage Ratio**: ((Passive + Portfolio Income) / Total Expenses) × 100
- **Savings Rate**: (Net Cashflow / Total Income) × 100

#### Freedom Date Projection
The system projects when financial freedom will be achieved based on:
1. Current passive + portfolio income growth rate
2. Compound growth calculation using 6-month historical data
3. Linear projection for new passive income streams

---

## API Endpoints

### Event API

**Base Path:** `/api/events`

All endpoints require authentication.

#### `GET /api/events`
Fetches all events for the authenticated user with optional filters.

**Query Parameters:**
- `entityType` (optional): Filter by entity type
- `startDate` (optional): Filter events from this date
- `endDate` (optional): Filter events up to this date
- `limit` (optional, default: 100): Maximum number of events
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "events": [...],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `GET /api/events/:entityType/:entityId`
Fetches all events for a specific entity.

**Response:**
```json
{
  "events": [...],
  "entityType": "INCOME",
  "entityId": 5
}
```

#### `PUT /api/events/:id` (Blocked)
Returns `403 Forbidden` - Events are immutable.

#### `DELETE /api/events/:id` (Blocked)
Returns `403 Forbidden` - Events are immutable.

---

### Analysis API

**Base Path:** `/api/analysis`

All endpoints require authentication.

#### `GET /api/analysis/snapshot`
Get financial snapshot for a specific date or current state.

**Query Parameters:**
- `date` (optional, YYYY-MM-DD): Historical date for reconstruction

**Response:**
```json
{
  "date": "2025-11-26",
  "currency": { "symbol": "$", "name": "USD" },
  "balanceSheet": {
    "totalCashBalance": 50000,
    "totalCash": 50000,
    "totalInvestedAssets": 200000,
    "totalAssets": 200000,
    "totalLiabilities": 50000,
    "netWorth": 200000
  },
  "cashflow": {
    "earnedIncome": 8000,
    "passiveIncome": 2000,
    "portfolioIncome": 500,
    "totalIncome": 10500,
    "totalExpenses": 6000,
    "netCashflow": 4500,
    "direction": "positive"
  },
  "ratios": {
    "passiveCoverageRatio": "41.67",
    "savingsRate": "42.86"
  },
  "richFlowMetrics": {
    "wealthVelocity": 4500,
    "wealthVelocityPct": 2.25,
    "solvencyRatio": 20.00,
    "freedomGap": 3500
  },
  "incomeQuadrant": {
    "EMPLOYEE": { "amount": 8000, "pct": 76.19 },
    "SELF_EMPLOYED": { "amount": 0, "pct": 0 },
    "BUSINESS_OWNER": { "amount": 0, "pct": 0 },
    "INVESTOR": { "amount": 2500, "pct": 23.81 },
    "total": 10500
  },
  "financialHealth": {
    "runway": 8.3,
    "freedomDate": "2028-06-15",
    "assetEfficiency": 1.25,
    "trends": {
      "netWorth": 5.2,
      "cashflow": -2.1
    }
  }
}
```

#### `GET /api/analysis/trajectory`
Get financial trajectory over a date range.

**Query Parameters:**
- `startDate` (required, YYYY-MM-DD): Start of the range
- `endDate` (required, YYYY-MM-DD): End of the range
- `interval` (optional): `daily`, `weekly`, or `monthly` (default: `monthly`)

**Response:**
```json
[
  {
    "date": "2025-01-01",
    "netWorth": 150000,
    "netWorthDelta": 0,
    "passiveIncome": 1500,
    "portfolioIncome": 400,
    "totalExpenses": 5500,
    "freedomGap": 3600,
    "wealthVelocity": 0,
    "assetEfficiency": 1.1,
    "netCashflow": 3500,
    "totalIncome": 9000,
    "incomeQuadrant": { ... },
    "currency": "$"
  },
  ...
]
```

#### `POST /api/analysis/snapshot`
Manually create a financial snapshot checkpoint.

**Response:**
```json
{
  "message": "Financial snapshot created successfully"
}
```

---

## Backend Implementation

### Directory Structure

```
backend/src/
├── controllers/
│   ├── event.controller.ts      # Event request handlers
│   └── analysis.controller.ts   # Analysis request handlers
│
├── services/
│   ├── event.service.ts         # Event creation and querying
│   └── analysis.service.ts      # Snapshot generation and reconstruction
│
├── routes/
│   ├── event.routes.ts          # Event API routes
│   └── analysis.routes.ts       # Analysis API routes
│
├── types/
│   └── event.types.ts           # Event type definitions
│
└── utils/
    └── incomeQuadrant.utils.ts  # Income quadrant classification
```

### Event Service (`event.service.ts`)

**Core Functions:**

**`createEvent(params)`**
Creates an immutable event log entry.

**`getEventsByUser(params)`**
Retrieves events for a user with optional filters.

**`getEventsByEntity(params)`**
Retrieves events for a specific entity.

**`getEventCount(userId, entityType?)`**
Returns total count of events for pagination.

**Helper Functions:**
- `logIncomeEvent()` - Log income-related events
- `logExpenseEvent()` - Log expense-related events
- `logAssetEvent()` - Log asset-related events
- `logLiabilityEvent()` - Log liability-related events
- `logCashSavingsEvent()` - Log cash savings events
- `logUserEvent()` - Log user account events

---

### Analysis Service (`analysis.service.ts`)

**Core Functions:**

**`getFinancialSnapshot(userId, date?)`**
Main entry point for retrieving financial snapshots. Intelligently decides between:
- Current state from database (no date or future date)
- Historical reconstruction via event replay (past date)

**`getCurrentFinancialSnapshot(userId)`**
Retrieves current financial state directly from database tables.

**`reconstructStateFromEvents(events, targetDate, initialCurrency)`**
Uses reducer pattern to replay events and reconstruct state.

**`calculateFinancialHealth(currentState, prevMonthState, sixMonthAgoState)`**
Calculates advanced metrics including runway, freedom date, and trends.

**`calculateSnapshotFromState(state, targetDate, financialHealth, prevMonthState)`**
Transforms reconstructed state into API response format with all metrics.

**`getFinancialTrajectory(userId, startDate, endDate, interval)`**
Generates time-series data for visualization using incremental reconstruction.

**`createSnapshot(userId)`**
Creates a cached snapshot for performance optimization.

---

### Pure Reducer Pattern

Each entity type has a dedicated reducer:

```typescript
const assetReducer = (state: FinancialState, event: Event): FinancialState => {
  const newState = { ...state, assets: new Map(state.assets) };
  switch (event.actionType) {
    case ActionType.CREATE:
    case ActionType.UPDATE:
      newState.assets.set(entityId, { id, name, value });
      break;
    case ActionType.DELETE:
      newState.assets.delete(entityId);
      break;
  }
  return newState;
};
```

The root reducer dispatches to the appropriate entity reducer:

```typescript
const rootReducer = (state: FinancialState, event: Event): FinancialState => {
  switch (event.entityType) {
    case EntityType.ASSET: return assetReducer(state, event);
    case EntityType.LIABILITY: return liabilityReducer(state, event);
    case EntityType.INCOME: return incomeReducer(state, event);
    case EntityType.EXPENSE: return expenseReducer(state, event);
    case EntityType.CASH_SAVINGS: return cashSavingsReducer(state, event);
    case EntityType.USER: return userReducer(state, event);
    default: return state;
  }
};
```

---

## Frontend Implementation

### Directory Structure

```
frontend/src/
├── pages/
│   ├── EventLog/
│   │   ├── EventLog.tsx         # Event log page component
│   │   └── EventLog.css         # Event log styles
│   │
│   └── Analysis/
│       ├── Analysis.tsx         # Analysis dashboard component
│       └── Analysis.css         # Analysis styles
│
└── utils/
    └── api.ts                   # API client with eventLogsAPI and analysisAPI
```

---

### Event Log Page (`EventLog.tsx`)

**Features:**
- Tabular display of all financial events
- Filter by event type (Income, Expense, Asset, Liability, Cash, User, Removed)
- Date range filtering (start/end date)
- Free-text search with highlighting
- Historical currency tracking per event
- Value change display with +/- indicators

**Key Components:**

**Type Badge**: Visual indicator for event type with color coding
- Income: Specific styling
- Expense: Specific styling
- Asset: Specific styling
- Liability: Specific styling
- Removed (deleted items): Specific styling
- Cash: Specific styling
- User: Specific styling

**Value Change Cell**: Shows the impact of each event
- Positive changes displayed in green with `+` prefix
- Negative changes displayed in red with `-` prefix
- Currency symbol matches historical context

**Currency History Tracking**: The component fetches USER events to build a timeline of currency changes, ensuring each event displays with its correct historical currency symbol.

---

### Analysis Page (`Analysis.tsx`)

**Features:**
- **Time Machine Controller**: Select any historical date to view reconstructed state
- **Comparison Mode**: Compare financial states between two dates
- **Financial Snapshot Dashboard**: Key metrics displayed in stat cards
- **Income Quadrant Pie Chart**: Visual breakdown of income sources
- **Trajectory Visualization**: Multiple charts showing financial progress over time

**Key Components:**

**StatCard**: Reusable metric display component
- Title, value, optional sub-value
- Trend indicator (up/down arrow with percentage)
- Progress bars for applicable metrics
- Accent colors for visual hierarchy

**Income Quadrant Chart**: Recharts PieChart showing:
- Employee income (Purple)
- Self-Employed income (Gold)
- Business Owner income (Green)
- Investor income (Red)

**Trajectory Charts** (using Recharts):
1. **The Rat Race Escape**: Line chart comparing Passive+Portfolio Income vs Expenses
2. **Net Worth & Velocity**: Composed chart with area for net worth and bars for velocity
3. **Asset Efficiency (ROA)**: Line chart tracking return on assets over time
4. **Quadrant Evolution**: Stacked area chart showing income quadrant distribution over time

**Comparison Report**: Side-by-side analysis of:
- Net worth evolution
- Financial health metrics (runway, freedom date, asset efficiency)
- Balance sheet changes
- Cashflow aggregates
- Ratio performance
- Income quadrant shift

---

## Data Flow Examples

### Event Logging Flow

1. **User Action**: User adds a new income line in Dashboard
2. **Backend Service**: `income.service.ts` creates the income line
3. **Event Logging**: `logIncomeEvent()` is called with:
   - `actionType`: `CREATE`
   - `entityType`: `INCOME`
   - `entitySubtype`: Income type (e.g., `EARNED`)
   - `afterValue`: `{ name, amount, type }`
4. **Database**: Event is persisted to `Event` table
5. **Response**: Success returned to frontend

### Historical Reconstruction Flow

1. **User Request**: User selects date "2025-06-15" in Analysis page
2. **API Call**: `GET /api/analysis/snapshot?date=2025-06-15`
3. **Service Logic**:
   - Check for cached snapshot (optimization)
   - Query all events up to target date
   - Sort events chronologically
   - Apply reducer pipeline to reconstruct state
   - Calculate metrics from reconstructed state
4. **Response**: Complete financial snapshot for that date

### Trajectory Generation Flow

1. **User Request**: View trajectory for last 12 months
2. **API Call**: `GET /api/analysis/trajectory?startDate=...&endDate=...&interval=monthly`
3. **Service Logic**:
   - Check for initial snapshot cache
   - Use incremental reconstruction (event-by-event)
   - Generate data point at each interval
   - Calculate metrics for each point
4. **Response**: Array of trajectory points for charting

---

## Security Considerations

### Data Ownership
- All queries are scoped by `userId` from the authenticated session
- Users can only view events and analysis for their own data
- JWT authentication required for all endpoints

### Event Immutability
- Events cannot be modified or deleted via API
- Explicit blocking of PUT/PATCH/DELETE requests
- Ensures audit trail integrity

### Input Validation
- Entity types validated against allowed enum values
- Date formats validated before processing
- Pagination limits enforced

---

## Performance Optimizations

### Snapshot Caching
- `FinancialSnapshot` table stores pre-computed states
- Reduces reconstruction time for frequently accessed dates
- Incremental reconstruction from nearest snapshot

### Incremental Reconstruction
- For trajectory generation, state is built incrementally
- Events are processed once, maintaining running state
- Avoids full replay for each data point

### Efficient Data Structures
- JavaScript `Map` used for O(1) lookups during reconstruction
- Events sorted once, processed in single pass
- Downsampling available for large trajectory datasets

### Database Indexing
- `Event` table indexed on `userId`, `entityType`, `entityId`
- Compound index on `userId, timestamp` for chronological queries
- `FinancialSnapshot` indexed on `userId, date`

### Query Limits
- Default limit of 100 events per request
- Maximum of 100,000 events for reconstruction
- Trajectory downsampling for datasets exceeding 1500 points

---


## Contributors

- **Event Sourcing Architecture**: Vince Latabe
- **Event Log Display and Snapshot Comparison**: Red Guilaran
- **Frontend Analysis Dashboard & Charts**: Gian Umadhay, Lance Demonteverde
- **Point-in-Time Reconstruction Logic**: Lance Demonteverde, Gian Umadhay, Red Guilaran
- **UI/UX Mobile Responsiveness**: Johan Oquendo, Paolo Quimpo
- **Database Schema Design and Documentation**: Vince Latabe
- **Code Clean Up and Administrative Tasks**: Vince Latabe


---

## Changelog

**Document Version:** 1.0  
**Last Updated:** November 26, 2025

### Changes
- Detailed documentation for Event Log and Analysis systems
- Detailed Event Sourcing architecture explanation
- Comprehensive API endpoint specifications
- Pure reducer pattern documentation
- Frontend component descriptions
- Performance optimization strategies


