# RichFlow Backend Development Progress

**Project:** RichFlow - Personal Finance Management Application  
**Last Updated:** October 29, 2025  
**Status:** Initial Development Phase Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Security](#authentication--security)
7. [Configuration](#configuration)
8. [Getting Started](#getting-started)
9. [Next Steps](#next-steps)

---

## Overview

The RichFlow backend provides the API and database infrastructure for the personal finance management application. Built with Node.js and Express, it handles user authentication, financial data management, and business logic for tracking income, expenses, assets, and liabilities.

The backend follows a RESTful API architecture and uses PostgreSQL as the database, managed through Prisma ORM for type-safe database access and migrations.

---

## Technology Stack

### Core Technologies
- **Node.js**: Runtime environment
- **Express**: v5.1.0 - Web application framework
- **TypeScript**: Type-safe JavaScript

### Database & ORM
- **PostgreSQL**: Primary database
- **Prisma**: v6.18.0 - ORM and database toolkit
- **@prisma/client**: v6.18.0 - Prisma database client
- **pg**: v8.16.3 - PostgreSQL client for Node.js

### Security & Authentication
- **bcrypt**: v6.0.0 - Password hashing
- **Session-based Authentication**: Token management via Session model

### Development Tools
- **nodemon**: v3.1.10 - Auto-restart during development
- **dotenv**: v17.2.3 - Environment variable management

### Middleware
- **cors**: v2.8.5 - Cross-Origin Resource Sharing

### Type Definitions
- **@types/bcrypt**: v6.0.0
- **@types/cors**: v2.8.19
- **@types/express**: v5.0.5
- **@types/pg**: v8.15.6

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/
│       ├── migration_lock.toml    # Migration lock file
│       └── 20251029064601_init/
│           └── migration.sql      # Initial database migration
│
├── src/
│   └── server.ts                  # Main server entry point
│
├── dist/                          # Compiled TypeScript output (generated)
│
├── package.json                   # Dependencies & scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## Database Schema

### User Model

**Purpose:** Stores user account information

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `email` (String, Unique) - User's email address
- `password` (String) - Hashed password
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- One-to-Many with `Session`
- One-to-Many with `BalanceSheet`
- One-to-Many with `IncomeStatement`

---

### Session Model

**Purpose:** Manages user authentication sessions

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `token` (String) - Session token
- `expiresAt` (DateTime) - Token expiration time
- `createdAt` (DateTime) - Session creation timestamp
- `isValid` (Boolean, Default: true) - Session validity status
- `userId` (Int, Foreign Key) - Reference to User

**Relations:**
- Many-to-One with `User` (Cascade delete)

**Note:** Implements token-based session management for user authentication

---

### IncomeStatement Model

**Purpose:** Container for user's income and expense data

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `userId` (Int, Foreign Key) - Reference to User

**Relations:**
- Many-to-One with `User` (Cascade delete)
- One-to-Many with `IncomeLine`
- One-to-Many with `Expense`

**Business Logic:** Represents a financial period's income statement

---

### IncomeLine Model

**Purpose:** Stores individual income entries

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `name` (String) - Income source name
- `amount` (Float) - Income amount
- `type` (String) - Income type (Earned, Portfolio, or Passive)
- `isId` (Int, Foreign Key) - Reference to IncomeStatement

**Relations:**
- Many-to-One with `IncomeStatement` (Cascade delete)

**Income Types:**
- **Earned**: Salary, wages, freelance income
- **Portfolio**: Dividends, interest, capital gains
- **Passive**: Rental income, royalties, automated businesses

---

### Expense Model

**Purpose:** Tracks user expenses

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `name` (String) - Expense description
- `amount` (Float) - Expense amount
- `isId` (Int, Foreign Key) - Reference to IncomeStatement

**Relations:**
- Many-to-One with `IncomeStatement` (Cascade delete)

---

### BalanceSheet Model

**Purpose:** Container for user's assets and liabilities

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `userId` (Int, Foreign Key) - Reference to User

**Relations:**
- Many-to-One with `User` (Cascade delete)
- One-to-Many with `Asset`
- One-to-Many with `Liability`

**Business Logic:** Represents a snapshot of user's financial position

---

### Asset Model

**Purpose:** Tracks user's assets

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `name` (String) - Asset name
- `value` (Float) - Asset value
- `bsId` (Int, Foreign Key) - Reference to BalanceSheet

**Relations:**
- Many-to-One with `BalanceSheet` (Cascade delete)

**Examples:** Cash, investments, property, vehicles

---

### Liability Model

**Purpose:** Tracks user's liabilities and debts

**Fields:**
- `id` (Int, Primary Key, Auto-increment)
- `name` (String) - Liability name
- `value` (Float) - Liability amount
- `bsId` (Int, Foreign Key) - Reference to BalanceSheet

**Relations:**
- Many-to-One with `BalanceSheet` (Cascade delete)

**Examples:** Loans, credit card debt, mortgages

---

## API Endpoints

### ✅ Implemented

#### Base Route

**`GET /`**

**Purpose:** Health check endpoint

**Response:**
```
API is running...
```

**Status Code:** 200

---

### ⏳ Pending Implementation

The following endpoints need to be implemented:

#### Authentication Endpoints

**`POST /api/auth/register`**
- User registration
- Password hashing with bcrypt
- Email validation

**`POST /api/auth/login`**
- User authentication
- Session token generation
- Password verification

**`POST /api/auth/logout`**
- Session invalidation
- Token cleanup

**`GET /api/auth/verify`**
- Token verification
- Session validation

---

#### User Endpoints

**`GET /api/users/profile`**
- Get authenticated user's profile
- Requires authentication

**`PUT /api/users/profile`**
- Update user information
- Requires authentication

**`DELETE /api/users/account`**
- Delete user account
- Cascade delete all related data

---

#### Income Endpoints

**`GET /api/income`**
- Get all income lines for authenticated user
- Filter by type (earned, portfolio, passive)

**`POST /api/income`**
- Create new income line
- Validate income type and amount

**`PUT /api/income/:id`**
- Update income line
- Validate ownership

**`DELETE /api/income/:id`**
- Delete income line
- Validate ownership

---

#### Expense Endpoints

**`GET /api/expenses`**
- Get all expenses for authenticated user

**`POST /api/expenses`**
- Create new expense

**`PUT /api/expenses/:id`**
- Update expense
- Validate ownership

**`DELETE /api/expenses/:id`**
- Delete expense
- Validate ownership

---

#### Balance Sheet Endpoints

**`GET /api/balance-sheet`**
- Get user's balance sheet with assets and liabilities
- Calculate net worth

**`POST /api/assets`**
- Add new asset

**`PUT /api/assets/:id`**
- Update asset

**`DELETE /api/assets/:id`**
- Delete asset

**`POST /api/liabilities`**
- Add new liability

**`PUT /api/liabilities/:id`**
- Update liability

**`DELETE /api/liabilities/:id`**
- Delete liability

---

#### Financial Summary Endpoints

**`GET /api/summary`**
- Get financial overview
- Total income, total expenses, net cash flow
- Asset and liability totals
- Net worth calculation

---

## Authentication & Security

### Current Implementation

**Password Storage:**
- bcrypt library installed and imported
- Ready for password hashing implementation

**Session Management:**
- Database schema supports token-based sessions
- Session expiration tracking
- Session validity flags

---

### Security Features to Implement

1. **Password Hashing**
   - Salt rounds configuration (recommended: 10-12)
   - Secure password comparison

2. **Token Generation**
   - Cryptographically secure token generation
   - Token expiration management
   - Automatic cleanup of expired sessions

3. **Authentication Middleware**
   - Verify session tokens
   - Attach user to request object
   - Handle unauthorized access

4. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Amount validation (positive numbers)
   - SQL injection prevention (Prisma handles this)

5. **Rate Limiting**
   - Prevent brute force attacks on login
   - API request throttling

6. **CORS Configuration**
   - Whitelist frontend domain
   - Configure allowed methods and headers

7. **Environment Variables**
   - Secure storage of sensitive data
   - Database connection strings
   - JWT secrets (if implementing JWT)

---

## Configuration

### TypeScript (`tsconfig.json`)

**Target:** ESNext

**Module System:** NodeNext

**Features:**
- Strict mode enabled
- Source maps for debugging
- Declaration files generation
- Strict type checking options:
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `isolatedModules`

**Output:**
- Directory: `dist/`
- Source maps: Enabled
- Declaration maps: Enabled

---

### Server Configuration (`server.ts`)

**Port:** 5000 (default) or environment variable `PORT`

**Middleware:**
- CORS enabled for all origins (should be restricted in production)
- JSON body parser enabled

**Database Connection:**
- PostgreSQL connection pool
- Connection string from environment variable `DATABASE_URL`

---

### Prisma Configuration

**Generator:**
- Client: `prisma-client-ts`

**Datasource:**
- Provider: PostgreSQL
- URL: Environment variable `DATABASE_URL`

**Migrations:**
- Initial migration created: `20251029064601_init`
- Migration lock: `postgresql`

---

### Environment Variables

Required environment variables (to be configured in `.env` file):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/richflow"
PORT=5000
```

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL database
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE richflow;
```

2. Configure `.env` file:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/richflow"
PORT=5000
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

### Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Database Management

**View database in Prisma Studio:**
```bash
npx prisma studio
```

**Create new migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Reset database (caution: deletes all data):**
```bash
npx prisma migrate reset
```

---

## Next Steps

### Immediate Priorities

1. **Authentication System**
   - Implement user registration endpoint
   - Implement login endpoint with session creation
   - Create authentication middleware
   - Implement logout functionality
   - Add token verification endpoint

2. **CRUD Operations for Income**
   - Create income line endpoint
   - Get income lines endpoint with filtering
   - Update income line endpoint
   - Delete income line endpoint
   - Validate user ownership

3. **CRUD Operations for Expenses**
   - Create expense endpoint
   - Get expenses endpoint
   - Update expense endpoint
   - Delete expense endpoint
   - Validate user ownership

4. **Balance Sheet Management**
   - Get balance sheet with assets and liabilities
   - Create/update/delete assets
   - Create/update/delete liabilities
   - Calculate net worth

5. **Financial Summary Endpoint**
   - Aggregate income data by type
   - Sum total expenses
   - Calculate net cash flow
   - Calculate net worth (assets - liabilities)

### Medium-Term Goals

6. **Enhanced Security**
   - Implement JWT-based authentication (alternative to sessions)
   - Add password strength validation
   - Implement rate limiting middleware
   - Configure CORS for specific frontend domain
   - Add request validation middleware

7. **Error Handling**
   - Centralized error handling middleware
   - Consistent error response format
   - Logging system (Winston, Morgan)
   - Database error handling

8. **Data Validation**
   - Input sanitization
   - Schema validation (Zod, Joi, or express-validator)
   - Custom validation rules for financial data

9. **Testing**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - Database testing with test database
   - Test coverage reporting

10. **API Documentation**
    - Swagger/OpenAPI documentation
    - API endpoint examples
    - Response schema documentation

### Long-Term Goals

11. **Performance Optimization**
    - Database query optimization
    - Implement caching (Redis)
    - Connection pooling configuration
    - Response compression

12. **Advanced Features**
    - Data export functionality (CSV, PDF)
    - Recurring income/expense scheduling
    - Budget tracking and alerts
    - Financial goal setting and tracking
    - Multi-currency support

13. **Audit & Analytics**
    - User activity logging
    - Financial trend analysis
    - Spending pattern detection
    - Data visualization endpoints

14. **Deployment**
    - Production environment configuration
    - Database migration strategy
    - Health check endpoints
    - Monitoring and alerting setup

---

## Known Issues & Technical Debt

1. **No Authentication Implemented:** API endpoints are not protected; anyone can access the server
2. **CORS Wide Open:** CORS allows all origins; should be restricted to frontend domain
3. **No Error Handling:** Server may crash on database errors or invalid requests
4. **No Input Validation:** Endpoints accept any data without validation
5. **No Logging:** No request logging or error tracking implemented
6. **Session Cleanup:** No automatic cleanup of expired sessions
7. **Environment Variables:** No `.env` file template or validation
8. **No Rate Limiting:** Vulnerable to DDoS and brute force attacks
9. **Prisma Generator Typo:** `prisma-client-ts` should be `prisma-client-js` in schema.prisma
10. **Database Connection:** No error handling for database connection failures

---

## Development Notes

### Database Schema Design Decisions

**Income Statement vs Balance Sheet:**
- Income Statement tracks cash flow (income and expenses)
- Balance Sheet tracks net worth (assets and liabilities)
- Separation allows for different reporting periods and financial views

**Cascade Deletes:**
- All related data is automatically deleted when a user is deleted
- Ensures data integrity and prevents orphaned records

**Foreign Key Naming:**
- `isId` = Income Statement ID
- `bsId` = Balance Sheet ID
- Consider renaming for clarity (e.g., `incomeStatementId`, `balanceSheetId`)

### TypeScript Configuration

**NodeNext Module System:**
- Modern Node.js module resolution
- Supports both CommonJS and ES modules
- Requires file extensions in imports

**Strict Type Checking:**
- Catches potential runtime errors at compile time
- May require additional type annotations
- Worth the effort for production stability

---

## Contributors

- **Database Schema Design**: Vince Latabe
- **Initial Server Setup**: Lance Demonteverde
- **Prisma Configuration**: Gian Umadhay
- **Clean Ups/Refactorings**: Vince Latabe

---

## Changelog

**Document Version:** 1.0  
**Last Updated:** October 29, 2025

### Changes
- Initial documentation created
- Database schema documented
- Technology stack documented
- ideal Development roadmap outlined
