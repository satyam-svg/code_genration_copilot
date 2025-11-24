# Code Generation Copilot 🚀

An AI-powered code generation platform that leverages Google's Gemini API to generate code in multiple programming languages. Built with Next.js frontend and Go backend, featuring real-time chat-based code generation with conversation history.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

## ✨ Features

- **AI-Powered Code Generation**: Generate code using Google Gemini API
- **Multi-Language Support**: Support for multiple programming languages
- **Chat-Based Interface**: Conversational UI similar to ChatGPT
- **Conversation History**: Save and retrieve previous chat sessions
- **User Authentication**: Secure JWT-based authentication
- **Syntax Highlighting**: Beautiful code display with syntax highlighting
- **Copy to Clipboard**: Easy code copying with toast notifications
- **Responsive Design**: Modern, premium UI that works on all devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Lucide icons
- **Code Highlighting**: react-syntax-highlighter
- **Notifications**: react-hot-toast

### Backend
- **Language**: Go 1.24
- **Web Framework**: Fiber v2
- **Database**: PostgreSQL
- **ORM**: Prisma Client Go
- **Authentication**: JWT (golang-jwt/jwt)
- **AI Integration**: Google Generative AI Go SDK
- **Password Hashing**: bcrypt (golang.org/x/crypto)

## 🏗️ Architecture

```
code-generation/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── AuthForm.tsx       # Login/Signup form
│   ├── ChatArea.tsx       # Main chat interface
│   ├── Sidebar.tsx        # Chat history sidebar
│   ├── Button.tsx         # Reusable button component
│   └── Icons.tsx          # Icon components
├── lib/                   # Utility libraries
│   ├── api.ts            # API client & auth service
│   └── config.ts         # API configuration
├── backend/              # Go backend
│   ├── cmd/api/         # Application entry point
│   │   └── main.go      # Server initialization
│   ├── internal/        # Internal packages
│   │   ├── auth/        # JWT authentication
│   │   ├── database/    # Database operations
│   │   ├── handlers/    # HTTP handlers
│   │   ├── middleware/  # HTTP middleware
│   │   ├── routes/      # Route definitions
│   │   └── server/      # Server setup
│   └── prisma/          # Database schema & migrations
│       └── schema.prisma
└── public/              # Static assets
```

## 🗄️ Database Schema

### ER Diagram

![ER Diagram](C:/Users/satya/.gemini/antigravity/brain/b1ea3c7e-7634-49c7-942f-74fa8725bfea/er_diagram_schema_1763944519091.png)

### Tables

#### **users**
Stores user account information.

| Column     | Type     | Constraints           | Description                |
|------------|----------|-----------------------|----------------------------|
| id         | INT      | PRIMARY KEY, AUTO_INC | Unique user identifier     |
| name       | STRING   | NOT NULL              | User's full name           |
| email      | STRING   | UNIQUE, NOT NULL      | User's email address       |
| password   | STRING   | NOT NULL              | Hashed password (bcrypt)   |
| created_at | DATETIME | DEFAULT NOW()         | Account creation timestamp |

**Relationships:**
- One-to-Many with `generations` (optional, can be null)
- One-to-Many with `chats` (cascade delete)

---

#### **languages**
Stores supported programming languages.

| Column | Type   | Constraints           | Description                    |
|--------|--------|-----------------------|--------------------------------|
| id     | INT    | PRIMARY KEY, AUTO_INC | Unique language identifier     |
| name   | STRING | UNIQUE, NOT NULL      | Language name (e.g., "Python") |

**Relationships:**
- One-to-Many with `generations` (restrict delete)

---

#### **generations**
Stores individual code generation requests and results.

| Column      | Type     | Constraints           | Description                  |
|-------------|----------|-----------------------|------------------------------|
| id          | INT      | PRIMARY KEY, AUTO_INC | Unique generation identifier |
| prompt      | STRING   | NOT NULL              | User's code request prompt   |
| code        | TEXT     | NOT NULL              | Generated code               |
| created_at  | DATETIME | DEFAULT NOW()         | Generation timestamp         |
| user_id     | INT      | FOREIGN KEY (nullable)| Reference to users.id        |
| language_id | INT      | FOREIGN KEY, NOT NULL | Reference to languages.id    |

**Indexes:**
- `created_at`
- `language_id, created_at`
- `user_id, created_at`

**Relationships:**
- Many-to-One with `users` (optional, SET NULL on delete)
- Many-to-One with `languages` (required, RESTRICT on delete)

---

#### **chats**
Stores chat sessions for conversation history.

| Column     | Type     | Constraints           | Description                |
|------------|----------|-----------------------|----------------------------|
| id         | INT      | PRIMARY KEY, AUTO_INC | Unique chat identifier     |
| title      | STRING   | DEFAULT "New Chat"    | Chat session title         |
| user_id    | INT      | FOREIGN KEY, NOT NULL | Reference to users.id      |
| created_at | DATETIME | DEFAULT NOW()         | Chat creation timestamp    |
| updated_at | DATETIME | AUTO UPDATE           | Last message timestamp     |

**Indexes:**
- `user_id, updated_at`

**Relationships:**
- Many-to-One with `users` (required, CASCADE on delete)
- One-to-Many with `messages` (cascade delete)

---

#### **messages**
Stores individual messages within chat sessions.

| Column     | Type     | Constraints           | Description                        |
|------------|----------|-----------------------|------------------------------------|
| id         | INT      | PRIMARY KEY, AUTO_INC | Unique message identifier          |
| chat_id    | INT      | FOREIGN KEY, NOT NULL | Reference to chats.id              |
| role       | STRING   | NOT NULL              | "user" or "assistant"              |
| content    | TEXT     | NOT NULL              | Message content/code               |
| language   | STRING   | NULLABLE              | Programming language (if code)     |
| created_at | DATETIME | DEFAULT NOW()         | Message timestamp                  |

**Indexes:**
- `chat_id, created_at`

**Relationships:**
- Many-to-One with `chats` (required, CASCADE on delete)

---

### Schema Principles

✅ **Normalization**: Schema follows 3NF (Third Normal Form)
- No redundant data storage
- Separate tables for distinct entities
- Proper use of foreign keys

✅ **Referential Integrity**
- All foreign keys properly defined
- Appropriate cascade/restrict rules
- Optional vs required relationships clearly defined

✅ **Indexing Strategy**
- Primary keys on all tables
- Unique constraints on email and language names
- Composite indexes for common query patterns
- Timestamp-based indexes for chronological queries

✅ **Data Types**
- Appropriate types for each field
- TEXT for potentially large content
- DATETIME for temporal data
- INT for identifiers

---

## 📊 Database Performance Analysis

### Time Complexity of Paginated Retrieval

#### Query Example: Fetch Generations with Pagination
```sql
SELECT * FROM generations 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;
```

#### Time Complexity Analysis

**Without Index:**
- **Time Complexity**: `O(n)` where n = total rows in table
- **Why?** Database must scan entire table to find matching rows, then sort them
- **Performance**: Degrades linearly as table grows
- **Example**: 1M rows → ~1M row scans

**With Composite Index `(user_id, created_at)`:**
- **Time Complexity**: `O(log n + k)` where:
  - `n` = total rows in table
  - `k` = number of rows returned (LIMIT)
- **Why?** 
  - `O(log n)` → B-tree index lookup to find first matching row
  - `O(k)` → Sequential read of k rows (already sorted in index)
- **Performance**: Logarithmic lookup + constant retrieval
- **Example**: 1M rows → ~20 comparisons + 20 row reads

#### Pagination Performance

| Scenario | Without Index | With Index `(user_id, created_at)` |
|----------|---------------|-------------------------------------|
| **First Page** (OFFSET 0) | O(n) | O(log n + k) |
| **Middle Page** (OFFSET 1000) | O(n) | O(log n + k + offset) |
| **Last Page** (OFFSET 10000) | O(n) | O(log n + k + offset) |

**Note**: Large OFFSETs can still be slow even with indexes because PostgreSQL must skip rows. For better performance with deep pagination, use **cursor-based pagination**:

```sql
-- Instead of OFFSET
SELECT * FROM generations 
WHERE user_id = ? AND created_at < ?
ORDER BY created_at DESC 
LIMIT 20;
```

---

### How Schema Affects Query Performance

#### 1. **Normalization Trade-offs**

**✅ Benefits:**
- Reduces data redundancy
- Maintains data integrity
- Smaller table sizes

**⚠️ Costs:**
- Requires JOINs for related data
- More complex queries

**Example Query:**
```sql
-- Fetch generation with user and language details
SELECT g.*, u.name as user_name, l.name as language_name
FROM generations g
LEFT JOIN users u ON g.user_id = u.id
INNER JOIN languages l ON g.language_id = l.id
WHERE g.id = ?;
```

**Performance Impact:**
- **Without Foreign Key Indexes**: O(n × m) - Nested loop join
- **With Foreign Key Indexes**: O(log n + log m) - Index-based join
- **Our Schema**: ✅ Has indexes on `user_id` and `language_id`

#### 2. **Composite Indexes for Query Patterns**

Our schema uses composite indexes to optimize common queries:

**Index: `(user_id, created_at)`**
```sql
-- ✅ OPTIMIZED: Uses index for both filter and sort
SELECT * FROM generations 
WHERE user_id = 123 
ORDER BY created_at DESC;

-- ✅ OPTIMIZED: Uses index for filter
SELECT * FROM generations 
WHERE user_id = 123;

-- ❌ NOT OPTIMIZED: Cannot use this index (wrong column order)
SELECT * FROM generations 
WHERE created_at > '2024-01-01';
```

**Index: `(language_id, created_at)`**
```sql
-- ✅ OPTIMIZED: Filter by language and sort by time
SELECT * FROM generations 
WHERE language_id = 1 
ORDER BY created_at DESC;
```

#### 3. **Flexible Querying**

**Single-Column Indexes:**
- `created_at` - Allows sorting all generations by time
- Supports queries without user/language filters

**Composite Indexes:**
- `(user_id, created_at)` - User-specific queries with time sorting
- `(language_id, created_at)` - Language-specific queries with time sorting
- `(chat_id, created_at)` - Chat message retrieval in order

This multi-index strategy provides **query flexibility** while maintaining **performance**.

---

### When Are Indexes Useful?

#### ✅ Indexes ARE Useful For:

1. **WHERE Clauses**
   ```sql
   WHERE user_id = 123  -- Uses index on user_id
   WHERE email = 'user@example.com'  -- Uses unique index on email
   ```

2. **ORDER BY Clauses**
   ```sql
   ORDER BY created_at DESC  -- Uses index on created_at
   ```

3. **JOIN Operations**
   ```sql
   JOIN users ON generations.user_id = users.id  -- Uses index on user_id
   ```

4. **Foreign Key Constraints**
   - Speeds up referential integrity checks
   - Optimizes CASCADE/RESTRICT operations

5. **UNIQUE Constraints**
   ```sql
   email UNIQUE  -- Prevents duplicates efficiently
   ```

#### ❌ Indexes Are NOT Useful For:

1. **Small Tables** (< 1000 rows)
   - Full table scan is faster than index lookup

2. **High Cardinality Columns with Frequent Updates**
   - Index maintenance overhead > query benefit

3. **Columns Not Used in Queries**
   - Wastes storage and slows down INSERT/UPDATE

4. **Full Table Scans**
   ```sql
   SELECT * FROM generations;  -- No WHERE/ORDER BY
   ```

---

### Indexes Created in Our Schema

#### **generations** Table

| Index | Type | Columns | Purpose | Query Pattern |
|-------|------|---------|---------|---------------|
| PRIMARY | B-tree | `id` | Unique identification | `WHERE id = ?` |
| INDEX | B-tree | `created_at` | Time-based sorting | `ORDER BY created_at` |
| COMPOSITE | B-tree | `(user_id, created_at)` | User's generations by time | `WHERE user_id = ? ORDER BY created_at` |
| COMPOSITE | B-tree | `(language_id, created_at)` | Language-specific generations | `WHERE language_id = ? ORDER BY created_at` |

**Example Queries Optimized:**
```sql
-- ✅ Uses (user_id, created_at) index
SELECT * FROM generations 
WHERE user_id = 123 
ORDER BY created_at DESC 
LIMIT 20;

-- ✅ Uses (language_id, created_at) index
SELECT * FROM generations 
WHERE language_id = 1 
ORDER BY created_at DESC;

-- ✅ Uses created_at index
SELECT * FROM generations 
ORDER BY created_at DESC 
LIMIT 100;
```

#### **chats** Table

| Index | Type | Columns | Purpose | Query Pattern |
|-------|------|---------|---------|---------------|
| PRIMARY | B-tree | `id` | Unique identification | `WHERE id = ?` |
| COMPOSITE | B-tree | `(user_id, updated_at)` | User's recent chats | `WHERE user_id = ? ORDER BY updated_at DESC` |

**Why `updated_at` instead of `created_at`?**
- Chats are sorted by **last activity** (most recent message)
- `updated_at` changes when new messages are added
- Provides better UX (recent conversations first)

#### **messages** Table

| Index | Type | Columns | Purpose | Query Pattern |
|-------|------|---------|---------|---------------|
| PRIMARY | B-tree | `id` | Unique identification | `WHERE id = ?` |
| COMPOSITE | B-tree | `(chat_id, created_at)` | Chat messages in order | `WHERE chat_id = ? ORDER BY created_at` |

**Optimized Query:**
```sql
-- ✅ Uses (chat_id, created_at) index
SELECT * FROM messages 
WHERE chat_id = 456 
ORDER BY created_at ASC;
```

#### **users** Table

| Index | Type | Columns | Purpose | Query Pattern |
|-------|------|---------|---------|---------------|
| PRIMARY | B-tree | `id` | Unique identification | `WHERE id = ?` |
| UNIQUE | B-tree | `email` | Prevent duplicate emails | `WHERE email = ?` (login) |

#### **languages** Table

| Index | Type | Columns | Purpose | Query Pattern |
|-------|------|---------|---------|---------------|
| PRIMARY | B-tree | `id` | Unique identification | `WHERE id = ?` |
| UNIQUE | B-tree | `name` | Prevent duplicate languages | `WHERE name = ?` |

---

### Index Performance Metrics

#### Storage Overhead
- **B-tree Index Size**: ~10-20% of table size per index
- **Our Schema**: 5 composite indexes + 5 primary keys + 2 unique indexes
- **Estimated Overhead**: ~30-40% additional storage
- **Trade-off**: ✅ Worth it for query performance

#### Write Performance Impact
- **INSERT**: Must update all indexes → Slight slowdown
- **UPDATE**: Only updates affected indexes
- **DELETE**: Must update all indexes → Slight slowdown

**Mitigation Strategies:**
- Batch inserts when possible
- Use transactions for multiple operations
- Indexes are on frequently queried columns (read-heavy workload)

#### Query Performance Gains

| Operation | Without Indexes | With Indexes | Improvement |
|-----------|-----------------|--------------|-------------|
| Find user by email | O(n) | O(log n) | **100-1000x faster** |
| Paginate generations | O(n) | O(log n + k) | **50-500x faster** |
| Load chat messages | O(n) | O(log n + k) | **50-500x faster** |
| Join generations with users | O(n²) | O(n log n) | **10-100x faster** |

---

### Best Practices Implemented

✅ **Composite indexes match query patterns**
- `(user_id, created_at)` for user-specific time-sorted queries
- `(chat_id, created_at)` for chronological message retrieval

✅ **Unique indexes for business constraints**
- Email uniqueness for user accounts
- Language name uniqueness

✅ **Foreign key indexes**
- All foreign keys have indexes for JOIN performance

✅ **Timestamp indexes**
- Support chronological sorting and filtering

✅ **Avoid over-indexing**
- Only index columns used in WHERE, ORDER BY, or JOIN
- No indexes on low-cardinality columns (e.g., role: "user"/"assistant")


## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Go 1.24+
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-generation
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up backend**
   ```bash
   cd backend
   go mod download
   ```

4. **Configure environment variables**
   
   Create `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/codegen?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=8080
   ```

   Create `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

5. **Run database migrations**
   ```bash
   cd backend
   go run github.com/steebchen/prisma-client-go migrate dev --name init
   ```

6. **Start the backend server**
   ```bash
   cd backend
   go run cmd/api/main.go
   ```

7. **Start the frontend development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📡 API Documentation

### Base URL
```
Development: http://localhost:8080
Production: https://your-backend-url.com
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### **POST** `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### **POST** `/api/auth/login`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### **POST** `/api/generate` 🔒
Generate code using AI (requires authentication).

**Request Body:**
```json
{
  "prompt": "Create a function to calculate factorial",
  "language": "python",
  "chatId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)",
    "language": "python",
    "chatId": 1,
    "messageId": 42
  }
}
```

---

#### **GET** `/api/chats` 🔒
Get all chat sessions for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Python Functions",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z"
    }
  ]
}
```

---

#### **GET** `/api/chats/:id` 🔒
Get a specific chat with all messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Python Functions",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Create a factorial function",
        "language": null,
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "def factorial(n):\n    ...",
        "language": "python",
        "createdAt": "2024-01-01T00:00:01Z"
      }
    ]
  }
}
```

## 🔐 Environment Variables

### Frontend (.env.local)

| Variable                    | Description                  | Example                      |
|-----------------------------|------------------------------|------------------------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL         | `http://localhost:8080`      |

### Backend (.env)

| Variable        | Description                      | Example                                          |
|-----------------|----------------------------------|--------------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string     | `postgresql://user:pass@localhost:5432/codegen` |
| `JWT_SECRET`    | Secret key for JWT signing       | `your-super-secret-key-change-in-production`    |
| `GEMINI_API_KEY`| Google Gemini API key            | `AIzaSy...`                                     |
| `PORT`          | Server port (optional)           | `8080`                                          |

## 🌐 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_API_BASE_URL`
4. Deploy

### Backend (Render/Railway/Fly.io)

1. **Build Command:**
   ```bash
   go build -o bin/server cmd/api/main.go
   ```

2. **Start Command:**
   ```bash
   ./bin/server
   ```

3. **Environment Variables:**
   Set all backend environment variables in your hosting platform

4. **Database:**
   Use a managed PostgreSQL instance (e.g., Render PostgreSQL, Supabase)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Next.js, Go, and Google Gemini AI**
