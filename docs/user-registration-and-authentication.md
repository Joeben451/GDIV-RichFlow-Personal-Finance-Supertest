# RichFlow Authentication System Documentation

**Project:** RichFlow - Personal Finance Management Application  
**Last Updated:** October 31, 2025  
**Status:** Authentication Core Implementation Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Authentication Flow](#authentication-flow)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Security Features](#security-features)
8. [API Endpoints](#api-endpoints)
9. [Configuration](#configuration)
10. [Getting Started](#getting-started)
11. [Next Steps](#next-steps)

---

## Overview

The RichFlow authentication system provides secure user registration, login, and session management functionality. It implements a token-based authentication mechanism using JWT (JSON Web Tokens) with session tracking stored in a PostgreSQL database.

The system is designed with security best practices in mind, including password hashing, input validation, rate limiting, and protected route management.

### Key Features

- User registration with email validation
- Secure password hashing with bcrypt
- JWT-based authentication
- Session management with database persistence
- Protected routes and API endpoints
- Token refresh mechanism
- Automatic session cleanup
- Rate limiting for authentication endpoints
- CORS configuration
- Frontend authentication context

---

## Technology Stack

### Backend Technologies

**Core Framework:**
- **Express**: v5.1.0 - Web application framework
- **TypeScript**: Type-safe JavaScript

**Authentication & Security:**
- **bcrypt**: v6.0.0 - Password hashing algorithm
- **jsonwebtoken**: v9.0.2 - JWT token generation and verification
- **express-validator**: Input validation and sanitization
- **express-rate-limit**: Rate limiting middleware

**Database:**
- **Prisma**: v6.18.0 - ORM for database operations
- **PostgreSQL**: Primary database
- **@prisma/client**: v6.18.0 - Prisma database client

**Middleware:**
- **cors**: v2.8.5 - Cross-Origin Resource Sharing
- **dotenv**: v17.2.3 - Environment variable management

### Frontend Technologies

**Core:**
- **React**: v19.2.0 - UI library
- **TypeScript**: v5.9.3 - Type safety
- **React Router DOM**: Client-side routing

**HTTP Client:**
- **Axios**: HTTP request library

**State Management:**
- **React Context API**: Global authentication state
- **React Hooks**: Local state management

---

## Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Pages: Landing, Login, Signup, Dashboard              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Context: AuthContext (Global State)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components: ProtectedRoute                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Utils: API Client (Axios)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       Backend API                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/auth/*                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware: Auth, Validation, Rate Limit, CORS        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers: auth.controller.ts                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services: auth.service.ts                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Utils: password.utils, jwt.utils, validation.utils   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tables: User, Session                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Frontend Layer:**
- User interface and form handling
- Client-side validation
- Token storage (localStorage/sessionStorage)
- Authentication state management
- Protected route access control

**Backend API Layer:**
- Request validation and sanitization
- Business logic execution
- Token generation and verification
- Session management
- Error handling and response formatting

**Service Layer:**
- Database operations via Prisma
- Password hashing and verification
- JWT token creation and validation
- Session lifecycle management

**Database Layer:**
- Persistent storage of user credentials
- Session token storage and tracking
- User profile data
- Related financial data (cascade relationships)

---

## Authentication Flow

### Registration Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  Fill Signup Form   │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │                     │  Validate Input     │                     │
 │                     │─────────────────────┘                     │
 │                     │                     │                     │
 │                     │  POST /api/auth/signup                    │
 │                     │────────────────────>│                     │
 │                     │                     │                     │
 │                     │                     │  Validate Request   │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Check Email Exists │
 │                     │                     │────────────────────>│
 │                     │                     │<────────────────────│
 │                     │                     │                     │
 │                     │                     │  Hash Password      │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Create User        │
 │                     │                     │────────────────────>│
 │                     │                     │<────────────────────│
 │                     │                     │                     │
 │                     │                     │  Generate JWT       │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Create Session     │
 │                     │                     │────────────────────>│
 │                     │<────────────────────│<────────────────────│
 │                     │  Token + User Data  │                     │
 │                     │                     │                     │
 │                     │  Store Token        │                     │
 │                     │─────────────────────┘                     │
 │<────────────────────│                     │                     │
 │  Redirect Dashboard │                     │                     │
```

### Login Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  Enter Credentials  │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │                     │  POST /api/auth/login                     │
 │                     │────────────────────>│                     │
 │                     │                     │                     │
 │                     │                     │  Validate Request   │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Find User by Email │
 │                     │                     │────────────────────>│
 │                     │                     │<────────────────────│
 │                     │                     │                     │
 │                     │                     │  Verify Password    │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Generate JWT       │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Create Session     │
 │                     │                     │────────────────────>│
 │                     │<────────────────────│<────────────────────│
 │                     │  Token + User Data  │                     │
 │                     │                     │                     │
 │                     │  Store Token        │                     │
 │                     │─────────────────────┘                     │
 │<────────────────────│                     │                     │
 │  Redirect Dashboard │                     │                     │
```

### Protected Route Access Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  Navigate to Page   │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │                     │  Check Auth State   │                     │
 │                     │─────────────────────┘                     │
 │                     │                     │                     │
 │                     │  GET /api/resource (with JWT in header)   │
 │                     │────────────────────>│                     │
 │                     │                     │                     │
 │                     │                     │  Verify JWT         │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Check Session      │
 │                     │                     │────────────────────>│
 │                     │                     │<────────────────────│
 │                     │                     │                     │
 │                     │                     │  Check Expiry       │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │<────────────────────│                     │
 │                     │  Authorized Data    │                     │
 │<────────────────────│                     │                     │
 │  Display Content    │                     │                     │
```

### Logout Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  Click Logout       │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │                     │  POST /api/auth/logout (with JWT)         │
 │                     │────────────────────>│                     │
 │                     │                     │                     │
 │                     │                     │  Verify JWT         │
 │                     │                     │─────────────────────┘
 │                     │                     │                     │
 │                     │                     │  Invalidate Session │
 │                     │                     │────────────────────>│
 │                     │<────────────────────│<────────────────────│
 │                     │  Success Response   │                     │
 │                     │                     │                     │
 │                     │  Clear Token        │                     │
 │                     │─────────────────────┘                     │
 │                     │                     │                     │
 │                     │  Clear Auth State   │                     │
 │                     │─────────────────────┘                     │
 │<────────────────────│                     │                     │
 │  Redirect Landing   │                     │                     │
```

---

## Backend Implementation

### Project Structure

```
backend/src/
├── controllers/
│   └── auth.controller.ts         # Authentication request handlers
│
├── services/
│   └── auth.service.ts            # Authentication business logic
│
├── middleware/
│   ├── auth.middleware.ts         # JWT verification & route protection
│   ├── validation.middleware.ts   # Request validation
│   ├── rateLimit.middleware.ts    # Rate limiting
│   └── errorHandler.middleware.ts # Global error handling
│
├── routes/
│   ├── auth.routes.ts             # Authentication routes
│   └── index.ts                   # Route aggregation
│
├── utils/
│   ├── jwt.utils.ts               # JWT operations
│   ├── password.utils.ts          # Password hashing
│   └── validation.utils.ts        # Validation schemas
│
├── types/
│   └── (type definitions)         # TypeScript interfaces
│
├── config/
│   └── database.config.ts         # Database configuration
│
└── server.ts                      # Application entry point
```

### Controllers (`auth.controller.ts`)

**Purpose:** Handle HTTP requests and responses for authentication endpoints

**Key Functions:**

**`signup`**
- Extract and validate user input
- Call authentication service for user creation
- Return JWT token and user data
- Handle duplicate email errors

**`login`**
- Validate credentials
- Call authentication service for login
- Return JWT token and user data
- Handle invalid credentials errors

**`logout`**
- Extract user ID from authenticated request
- Invalidate user session
- Return success response

**`verifyToken`**
- Verify JWT token validity
- Return user data if valid
- Handle expired or invalid tokens

**Response Format:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      email: string;
    };
  };
  error?: string;
}
```

---

### Services (`auth.service.ts`)

**Purpose:** Business logic and database operations for authentication

**Key Functions:**

**`createUser(email: string, password: string)`**
- Check if email already exists
- Hash password using bcrypt
- Create user record in database
- Generate JWT token
- Create session record
- Return token and user data

**`authenticateUser(email: string, password: string)`**
- Find user by email
- Verify password hash
- Generate new JWT token
- Create new session record
- Return token and user data

**`invalidateSession(userId: number)`**
- Find active sessions for user
- Mark sessions as invalid
- Update session records in database

**`verifySession(token: string)`**
- Verify JWT token
- Check session validity in database
- Check expiration time
- Return user data if valid

**`cleanupExpiredSessions()`**
- Find expired sessions
- Mark as invalid or delete
- Run periodically (cron job)

---

### Middleware

#### Authentication Middleware (`auth.middleware.ts`)

**Purpose:** Protect routes requiring authentication

**Implementation:**
```typescript
export const authenticate = async (req, res, next) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check session validity in database
    const session = await prisma.session.findFirst({
      where: { 
        userId: decoded.userId, 
        isValid: true,
        expiresAt: { gte: new Date() }
      }
    });
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session' 
      });
    }
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};
```

**Usage:**
```typescript
router.get('/protected-route', authenticate, controller.protectedHandler);
```

---

#### Validation Middleware (`validation.middleware.ts`)

**Purpose:** Validate and sanitize request data

**Validators:**

**Signup Validation:**
- Email: Valid format, normalized
- Password: Minimum 8 characters, contains uppercase, lowercase, number
- Confirm Password: Matches password field

**Login Validation:**
- Email: Valid format, normalized
- Password: Not empty

**Implementation:**
```typescript
export const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
];
```

---

#### Rate Limit Middleware (`rateLimit.middleware.ts`)

**Purpose:** Prevent brute force attacks and API abuse

**Configuration:**

**Authentication Endpoints:**
- Window: 15 minutes
- Max requests: 5 attempts
- Message: "Too many login attempts, please try again later"

**General API:**
- Window: 15 minutes
- Max requests: 100 attempts

**Implementation:**
```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

#### Error Handler Middleware (`errorHandler.middleware.ts`)

**Purpose:** Centralized error handling and response formatting

**Features:**
- Catch and format all errors
- Log errors for debugging
- Return consistent error responses
- Hide sensitive error details in production
- Handle specific error types (validation, database, authentication)

**Implementation:**
```typescript
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }
  
  if (err.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({
      success: false,
      message: 'Email already exists'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
```

---

### Utilities

#### JWT Utilities (`jwt.utils.ts`)

**Functions:**

**`generateToken(payload: object): string`**
- Create JWT with user ID and email
- Set expiration time (e.g., 7 days)
- Sign with secret key

**`verifyToken(token: string): object`**
- Verify JWT signature
- Check expiration
- Return decoded payload
- Throw error if invalid

**`refreshToken(oldToken: string): string`**
- Verify old token
- Generate new token with same payload
- Extend expiration time

---

#### Password Utilities (`password.utils.ts`)

**Functions:**

**`hashPassword(password: string): Promise<string>`**
- Generate salt (10-12 rounds)
- Hash password with bcrypt
- Return hashed password

**`verifyPassword(password: string, hash: string): Promise<boolean>`**
- Compare plain password with hash
- Return true if match, false otherwise

**Security:**
- Salt rounds: 10 (configurable via environment variable)
- Bcrypt algorithm provides timing attack protection

---

#### Validation Utilities (`validation.utils.ts`)

**Functions:**

**`validateEmail(email: string): boolean`**
- Check email format using regex
- Verify domain exists (optional)

**`validatePasswordStrength(password: string): object`**
- Check minimum length
- Check for uppercase, lowercase, numbers, special characters
- Return strength score and suggestions

**`sanitizeInput(input: string): string`**
- Remove dangerous characters
- Prevent SQL injection (Prisma handles this)
- Prevent XSS attacks

---

### Routes (`auth.routes.ts`)

**Base Path:** `/api/auth`

**Endpoints:**

```typescript
POST   /signup        # User registration
POST   /login         # User login
POST   /logout        # User logout (protected)
GET    /verify        # Verify token (protected)
POST   /refresh       # Refresh token (protected)
```

**Route Configuration:**
```typescript
import express from 'express';
import { signupValidation, loginValidation } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

router.post('/signup', 
  authRateLimiter, 
  signupValidation, 
  authController.signup
);

router.post('/login', 
  authRateLimiter, 
  loginValidation, 
  authController.login
);

router.post('/logout', 
  authenticate, 
  authController.logout
);

router.get('/verify', 
  authenticate, 
  authController.verifyToken
);

export default router;
```

---

## Frontend Implementation

### Project Structure

```
frontend/src/
├── pages/
│   ├── Landing/
│   │   ├── Landing.tsx            # Landing page
│   │   └── Landing.css
│   │
│   ├── Login/
│   │   ├── login.tsx              # Login page
│   │   └── login.css
│   │
│   ├── Signup/
│   │   ├── Signup.tsx             # Signup page
│   │   └── Signup.css
│   │
│   └── Dashboard/
│       ├── Dashboard.tsx          # Protected dashboard
│       └── Dashboard.css
│
├── context/
│   └── AuthContext.tsx            # Global auth state
│
├── components/
│   └── ProtectedRoute.tsx         # Route protection component
│
├── utils/
│   └── api.ts                     # API client configuration
│
└── index.tsx                      # App entry point with routing
```

---

### Authentication Context (`AuthContext.tsx`)

**Purpose:** Global authentication state management

**State:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Actions:**
- `login(email, password)` - Authenticate user
- `signup(email, password)` - Register new user
- `logout()` - Clear authentication state
- `verifyAuth()` - Check if user is authenticated

**Implementation:**
```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };
  
  const logout = async () => {
    await api.post('/auth/logout');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  useEffect(() => {
    if (token) {
      // Verify token on mount
      verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### Protected Route Component (`ProtectedRoute.tsx`)

**Purpose:** Restrict access to authenticated users only

**Implementation:**
```typescript
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
```

**Usage:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

### API Client (`api.ts`)

**Purpose:** Centralized HTTP client configuration

**Features:**
- Base URL configuration
- Automatic token attachment
- Request/response interceptors
- Error handling

**Implementation:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Login Page (`Login/login.tsx`)

**Features:**
- Email and password input fields
- Client-side validation
- Error message display
- Loading state during authentication
- Redirect to dashboard on success

**Key Functionality:**
```typescript
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);
  
  try {
    await login(email, password);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

### Signup Page (`Signup/Signup.tsx`)

**Features:**
- Email, password, and confirm password fields
- Client-side validation
- Password strength indicator
- Error message display
- Loading state during registration
- Redirect to dashboard on success

**Validation:**
- Email format validation
- Password minimum length (8 characters)
- Password complexity requirements
- Password confirmation match

**Key Functionality:**
```typescript
const handleSignup = async (e) => {
  e.preventDefault();
  setError('');
  
  // Validate password match
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  
  setIsLoading(true);
  
  try {
    await signup(email, password);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Signup failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Security Features

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10-12
- Timing attack protection built-in
- Rainbow table protection via salting

**Password Requirements:**
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number
- Optional: special character requirement
- Password strength validation

---

### Token Security

**JWT Configuration:**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret key: Strong, randomly generated, stored in environment variable
- Expiration: 7 days (configurable)
- Payload: User ID and email only (no sensitive data)

**Token Storage:**
- Frontend: localStorage (consider httpOnly cookies for enhanced security)
- Backend: Session table with expiration tracking
- Refresh mechanism: Automatic token refresh before expiration

**Token Validation:**
- Signature verification
- Expiration check
- Session validity check in database
- Revocation support via session invalidation

---

### Session Management

**Database Schema:**
```prisma
model Session {
  id        Int      @id @default(autoincrement())
  token     String
  expiresAt DateTime
  createdAt DateTime @default(now())
  isValid   Boolean  @default(true)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Features:**
- Multiple active sessions per user
- Session expiration tracking
- Manual session invalidation (logout)
- Automatic cleanup of expired sessions

---

### Rate Limiting

**Authentication Endpoints:**
- 5 attempts per 15 minutes per IP
- Prevents brute force password attacks
- Lockout message after limit reached

**General API:**
- 100 requests per 15 minutes per IP
- Prevents API abuse and DDoS

---

### Input Validation

**Server-Side:**
- Express-validator for all inputs
- Email format validation
- Password strength validation
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (input sanitization)

**Client-Side:**
- HTML5 form validation
- Custom JavaScript validation
- Real-time feedback
- Prevents unnecessary API calls

---

### CORS Configuration

**Development:**
- Allow all origins for testing
- Allow credentials

**Production:**
- Whitelist frontend domain only
- Specific allowed methods (GET, POST, PUT, DELETE)
- Specific allowed headers
- Credentials enabled

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### HTTPS/TLS

**Production Requirements:**
- SSL/TLS certificate required
- HTTPS-only communication
- Secure cookie flags (httpOnly, secure, sameSite)
- HSTS header enabled

---

## API Endpoints

### `POST /api/auth/signup`

**Purpose:** Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**409 - Email Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### `POST /api/auth/login`

**Purpose:** Authenticate existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**

**401 - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**429 - Too Many Requests:**
```json
{
  "success": false,
  "message": "Too many login attempts, please try again later"
}
```

---

### `POST /api/auth/logout`

**Purpose:** Invalidate user session

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Response:**

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### `GET /api/auth/verify`

**Purpose:** Verify token validity and get user data

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Response:**

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired session"
}
```

---

## Configuration

### Environment Variables

**Backend (`.env`):**
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/richflow"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="7d"

# CORS
FRONTEND_URL="http://localhost:3000"

# Password
BCRYPT_SALT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

**Frontend (`.env`):**
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

---

### TypeScript Configuration

**Backend (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Frontend (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

---

## Getting Started

### Prerequisites

- Node.js v16+
- PostgreSQL database
- npm or yarn

### Backend Setup

**1. Navigate to backend directory:**
```bash
cd backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create `.env` file:**
```bash
cp .env.example .env
```

**4. Configure environment variables:**
Edit `.env` file with your database credentials and secrets.

**5. Run database migrations:**
```bash
npx prisma migrate dev
```

**6. Generate Prisma client:**
```bash
npx prisma generate
```

**7. Start development server:**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

---

### Frontend Setup

**1. Navigate to frontend directory:**
```bash
cd frontend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create `.env` file:**
```bash
cp .env.example .env
```

**4. Configure API URL:**
Edit `.env` file to point to backend URL.

**5. Start development server:**
```bash
npm start
```

Frontend will run on `http://localhost:3000`

---

### Testing Authentication

**1. Register a new user:**
- Navigate to `http://localhost:3000/signup`
- Fill in email, password, and confirm password
- Click "Sign up"
- Should redirect to dashboard

**2. Logout:**
- Click logout button in dashboard
- Should redirect to landing page

**3. Login with existing user:**
- Navigate to `http://localhost:3000/login`
- Enter email and password
- Click "Login"
- Should redirect to dashboard

**4. Test protected routes:**
- Try accessing `/dashboard` without authentication
- Should redirect to login page

---

## Next Steps

### Immediate Priorities

1. **Password Reset Flow**
   - Forgot password endpoint
   - Email verification system
   - Password reset token generation
   - Password update endpoint

2. **Email Verification**
   - Send verification email on signup
   - Email verification token
   - Verify email endpoint
   - Resend verification email

3. **Enhanced Session Management**
   - View active sessions
   - Logout from specific sessions
   - Logout from all sessions
   - Session device information tracking

4. **Two-Factor Authentication (2FA)**
   - TOTP implementation
   - QR code generation
   - Backup codes
   - 2FA enforcement options

---

### Medium-Term Goals

5. **OAuth Integration**
   - Google OAuth
   - GitHub OAuth
   - Facebook OAuth
   - Link/unlink accounts

6. **Account Management**
   - Update email address
   - Change password
   - Delete account
   - Export user data (GDPR compliance)

7. **Enhanced Security**
   - Implement httpOnly cookies instead of localStorage
   - Add refresh token rotation
   - Implement device fingerprinting
   - Add login history tracking

8. **Monitoring & Logging**
   - Failed login attempt tracking
   - Suspicious activity detection
   - Security event logging
   - Admin notification system

---

### Long-Term Goals

9. **Advanced Authentication**
   - Passwordless authentication (magic links)
   - Biometric authentication support
   - WebAuthn/FIDO2 implementation

10. **Compliance & Privacy**
    - GDPR compliance features
    - User consent management
    - Data retention policies
    - Privacy policy acceptance tracking

11. **Admin Features**
    - User management dashboard
    - Ban/suspend accounts
    - View user sessions
    - Security audit logs

---

## Known Issues & Technical Debt

1. **Token Storage:** Using localStorage instead of httpOnly cookies (XSS vulnerability)
2. **Session Cleanup:** Manual cleanup required; no automated cron job implemented
3. **Password Reset:** Not implemented yet
4. **Email Verification:** Not implemented yet
5. **Rate Limiting:** IP-based only; doesn't handle proxies or distributed attacks
6. **Error Messages:** Some error messages may reveal too much information
7. **Token Refresh:** Manual refresh required; no automatic refresh before expiration
8. **CORS:** Wide open in development; needs production configuration
9. **Logging:** No centralized logging system
10. **Testing:** No automated tests for authentication flow

---

## Security Best Practices

### For Developers

1. **Never commit secrets:**
   - Use `.env` files
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Validate all inputs:**
   - Server-side validation is mandatory
   - Client-side validation is for UX only
   - Sanitize all user inputs

3. **Use HTTPS in production:**
   - Never transmit credentials over HTTP
   - Enable HSTS
   - Use secure cookie flags

4. **Keep dependencies updated:**
   - Regularly run `npm audit`
   - Update packages with security vulnerabilities
   - Use tools like Snyk or Dependabot

5. **Implement logging:**
   - Log security events
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

---

### For Users

1. **Use strong passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Don't reuse passwords across sites

2. **Enable 2FA (when available):**
   - Adds extra layer of security
   - Prevents account takeover even if password is compromised

3. **Be cautious with email:**
   - Verify sender before clicking links
   - RichFlow will never ask for password via email
   - Be wary of phishing attempts

---

## Testing Checklist

### Manual Testing

- [ ] User can register with valid email and password
- [ ] Registration fails with duplicate email
- [ ] Registration fails with weak password
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent email
- [ ] User can access dashboard after login
- [ ] User cannot access dashboard without login
- [ ] User can logout successfully
- [ ] Token is removed after logout
- [ ] User is redirected to login after token expires
- [ ] Rate limiting works after multiple failed attempts
- [ ] CORS allows frontend origin
- [ ] CORS blocks unauthorized origins

---

## Contributors

- **User Registration and Authentication with JWT Tokens**: Lance Demonteverde
- **Frontend Integration**: Lance Demonteverde, Gian Umadhay
- **UI/UX Design**: Gian Umadhay, Joeben Quimpo
- **Backend Architecture and Cleanups/Fixes**: Vince Latabe
- **Testing & QA**: Team Effort

---

## Changelog

**Document Version:** 1.0  
**Last Updated:** October 31, 2025

### Changes
- Initial authentication system documentation
- Architecture and flow diagrams
- Backend and frontend implementation details
- Security features documented
- API endpoint specifications
- Configuration guidelines
