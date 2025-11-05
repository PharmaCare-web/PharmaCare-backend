# Authentication Feature

Complete authentication system with JWT token-based authentication.

## Features

- ✅ User Registration
- ✅ User Login
- ✅ JWT Token Generation
- ✅ Protected Routes
- ✅ Password Hashing (bcrypt)
- ✅ Token Verification Middleware
- ✅ Get Current User
- ✅ Logout

## API Endpoints

### Public Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Protected Endpoints (Require Authentication)

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Password Requirements

- Minimum 6 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

## Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
```

## Usage Example

### Register a User
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Access Protected Route
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.user);
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password must be at least 6 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### User Already Exists (409)
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt (10 salt rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after configured time (default: 7 days)
4. **Input Validation**: All inputs are validated before processing
5. **Password Requirements**: Strong password requirements enforced

## Files Structure

```
backend/
├── routes/
│   └── authRoutes.js          # Authentication routes
├── controllers/
│   └── authController.js      # Authentication logic
├── middleware/
│   └── auth.js                # JWT verification middleware
├── utils/
│   └── validation.js          # Input validation
└── data/
    └── users.json             # User storage (JSON file)
```

## Next Steps

- Implement password reset functionality
- Add email verification
- Implement token refresh mechanism
- Add rate limiting for login attempts
- Implement password change functionality

