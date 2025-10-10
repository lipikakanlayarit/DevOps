# User Registration Guide

## Overview
This guide explains how to create new user and organizer accounts that will be saved to your local database.

## Registration Endpoints

### 1. Register as a Regular User

**Endpoint:** `POST /api/auth/register/user`

**No authentication required** - This is a public endpoint.

```bash
POST http://localhost:8080/api/auth/register/user
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "idCardPassport": "AB1234567"
}
```

**Required Fields:**
- `username` - Unique username
- `email` - Unique email address
- `password` - Password (will be hashed before storage)

**Optional Fields:**
- `firstName` - First name
- `lastName` - Last name
- `phoneNumber` - Phone number
- `idCardPassport` - ID card or passport number

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user_id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Username or email already exists
- `500 Internal Server Error` - Registration failed

---

### 2. Register as an Organizer

**Endpoint:** `POST /api/auth/register/organizer`

**No authentication required** - This is a public endpoint.

```bash
POST http://localhost:8080/api/auth/register/organizer
Content-Type: application/json

{
  "username": "event_org",
  "email": "organizer@example.com",
  "password": "organizerPass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "address": "123 Business St, City",
  "companyName": "Events Inc.",
  "taxId": "TAX123456"
}
```

**Required Fields:**
- `username` - Unique username
- `email` - Unique email address
- `password` - Password (will be hashed before storage)

**Optional Fields:**
- `firstName` - First name
- `lastName` - Last name
- `phoneNumber` - Phone number
- `address` - Business address
- `companyName` - Company or organization name
- `taxId` - Tax identification number

**Success Response (201 Created):**
```json
{
  "message": "Organizer registered successfully",
  "organizer_id": 1,
  "username": "event_org",
  "email": "organizer@example.com",
  "verification_status": "pending"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Username or email already exists
- `500 Internal Server Error` - Registration failed

---

## Complete Flow: Register → Login → Use API

### Step 1: Register an Account

```bash
# Register as a user
curl -X POST http://localhost:8080/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Step 2: Login to Get JWT Token

```bash
# Login with your new account
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "testuser",
  "role": "USER"
}
```

### Step 3: Use the Token for Authenticated Requests

```bash
# Use the token in Authorization header
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

## Verify Registration in Database

After registering, you can verify the account was saved to the database:

### For Users:
```sql
SELECT * FROM users;
```

You should see your new user with:
- `user_id` - Auto-generated ID
- `username` - Your username
- `email` - Your email
- `password_hash` - BCrypt hashed password (not plain text)
- `roles` - Should be "USER"
- Other optional fields you provided

### For Organizers:
```sql
SELECT * FROM organizers;
```

You should see your new organizer with:
- `organizer_id` - Auto-generated ID
- `username` - Your username
- `email` - Your email
- `password_hash` - BCrypt hashed password (not plain text)
- `verification_status` - Should be "pending"
- Other optional fields you provided

---

## Security Features

1. **Password Hashing**: Passwords are hashed using BCrypt before storage
2. **Unique Constraints**: Usernames and emails must be unique
3. **Validation**: Required fields are validated
4. **Role Assignment**: 
   - Users automatically get "USER" role
   - Organizers can create and manage events
5. **Public Registration**: No authentication needed to create an account

---

## Example cURL Commands

### Register a User (Minimal)
```bash
curl -X POST http://localhost:8080/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@test.com",
    "password": "pass123"
  }'
```

### Register a User (With Optional Fields)
```bash
curl -X POST http://localhost:8080/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@test.com",
    "password": "secure123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890"
  }'
```

### Register an Organizer
```bash
curl -X POST http://localhost:8080/api/auth/register/organizer \
  -H "Content-Type: application/json" \
  -d '{
    "username": "eventorg",
    "email": "org@test.com",
    "password": "orgpass123",
    "companyName": "My Events Company"
  }'
```

---

## Testing the Complete Flow

1. **Start your database and application**
   ```bash
   docker-compose up -d
   ```

2. **Register a new user**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register/user \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"pass123"}'
   ```

3. **Check the database**
   ```bash
   docker exec -it <postgres_container> psql -U devuser -d devopsdb
   SELECT * FROM users;
   ```

4. **You should see your new user in the database!**

---

## Troubleshooting

### Issue: "Username already exists"
**Solution:** Choose a different username or check existing users in database

### Issue: "Email already exists"
**Solution:** Use a different email address

### Issue: Data not appearing in database
**Checklist:**
- ✅ Database is running (`docker ps`)
- ✅ Application connected to database (check logs)
- ✅ No errors in application logs
- ✅ Using correct database name and credentials
- ✅ Registration returned 201 status code

### Issue: 401 Unauthorized when accessing APIs
**Solution:** Make sure you:
1. Registered successfully (got user_id back)
2. Logged in (got JWT token)
3. Include token in Authorization header: `Bearer <token>`
