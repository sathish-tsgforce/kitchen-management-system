# User Management System

This document provides detailed information about the user management system in Fortitude Culina, including how Supabase Auth is integrated, API endpoints, and the various user management flows.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Supabase Auth Integration](#supabase-auth-integration)
- [API Endpoints](#api-endpoints)
- [User Creation Flow](#user-creation-flow)
- [User Deletion Flow](#user-deletion-flow)
- [User Update Flow](#user-update-flow)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

The user management system in Fortitude Culina allows administrators to:

- Create new users with predefined roles
- Update existing users' information
- Delete users from the system
- View all users with their assigned roles

The system integrates with Supabase Auth for authentication and maintains a separate `users` table in the database for application-specific user data.

## Architecture

The user management system consists of:

1. **Frontend Components**:
   - User table for displaying and managing users
   - User form for creating and editing users
   - Confirmation dialogs for destructive actions

2. **API Endpoints**:
   - `/api/users` for listing and creating users
   - `/api/users/[id]` for retrieving, updating, and deleting specific users
   - `/api/roles` for retrieving available roles

3. **Database Tables**:
   - `users` table for storing user information
   - `roles` table for storing role definitions

4. **Supabase Auth**:
   - Handles user authentication
   - Stores credentials securely
   - Manages email verification

## Supabase Auth Integration

### Client Setup

The application uses two Supabase clients:

1. **Regular Client** (`supabase`):
   - Uses the anon key
   - Has limited permissions
   - Used for most database operations

2. **Admin Client** (`supabaseAdmin`):
   - Uses the service role key
   - Has elevated permissions
   - Used for auth operations that require admin privileges

\`\`\`typescript
// Regular client
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Admin client
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null
\`\`\`

### User Authentication

When a user logs in, the application:

1. Authenticates with Supabase Auth
2. Retrieves the user's information from the `users` table
3. Loads the user's role and permissions

## API Endpoints

### GET /api/users

Retrieves all users with their roles.

**Response:**
\`\`\`json
[
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role_id": 1,
    "role": "Admin"
  },
  ...
]
\`\`\`

### POST /api/users

Creates a new user in both Supabase Auth and the `users` table.

**Request Body:**
\`\`\`json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User",
  "role_id": 2
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "new-user-uuid",
  "email": "newuser@example.com",
  "name": "New User",
  "role_id": 2,
  "role": "Editor"
}
\`\`\`

### GET /api/users/[id]

Retrieves a specific user by ID.

**Response:**
\`\`\`json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role_id": 1,
  "role": "Admin"
}
\`\`\`

### PATCH /api/users/[id]

Updates a specific user's information.

**Request Body:**
\`\`\`json
{
  "name": "Updated Name",
  "role_id": 3
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "Updated Name",
  "role_id": 3,
  "role": "Viewer"
}
\`\`\`

### DELETE /api/users/[id]

Deletes a user from both Supabase Auth and the `users` table.

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

### GET /api/roles

Retrieves all available roles.

**Response:**
\`\`\`json
[
  {
    "id": 1,
    "name": "Admin"
  },
  {
    "id": 2,
    "name": "Editor"
  },
  {
    "id": 3,
    "name": "Viewer"
  }
]
\`\`\`

## User Creation Flow

### Process Overview

1. User submits the creation form with email, password, name, and role
2. The application sends a POST request to `/api/users`
3. The server attempts to create the user in Supabase Auth
4. If successful, the server creates a record in the `users` table
5. The server returns the newly created user

### Implementation Details

The user creation process uses the Supabase Admin API when available:

\`\`\`typescript
// Using admin client (preferred)
const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // Auto-verify the email
  user_metadata: { name },
})
\`\`\`

If the admin client is not available, it falls back to the regular signup method:

\`\`\`typescript
// Fallback to regular signup
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name },
    emailRedirectTo: `${new URL(request.url).origin}/login`,
  },
})
\`\`\`

After creating the user in Supabase Auth, the server inserts a record in the `users` table:

\`\`\`typescript
const { data, error } = await supabase
  .from("users")
  .insert({
    id: authData.user.id,
    email,
    name,
    role_id,
    password: hashedPassword, // Hashed for database storage only
  })
  .select(`
    id,
    email,
    name,
    role_id,
    role:roles(id, name)
  `)
  .single()
\`\`\`

### Auto-Verification

When using the admin client, new users are automatically verified (`email_confirm: true`), allowing them to log in immediately without email verification.

When using the regular signup method, users receive a verification email and must verify their email before logging in.

## User Deletion Flow

### Process Overview

1. User confirms the deletion action
2. The application sends a DELETE request to `/api/users/[id]`
3. The server attempts to delete the user from Supabase Auth
4. The server deletes the user record from the `users` table
5. The server returns a success response

### Implementation Details

The user deletion process first attempts to delete the user from Supabase Auth:

\`\`\`typescript
// Using admin client (preferred)
if (supabaseAdmin) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  // Handle error if any
}
\`\`\`

Then it deletes the user from the database:

\`\`\`typescript
const { error: dbError } = await supabase.from("users").delete().eq("id", id)
\`\`\`

If the auth deletion fails but the database deletion succeeds, the API returns a warning:

\`\`\`typescript
return NextResponse.json({
  success: true,
  warning: "User deleted from database but not from auth system. The auth record may need manual cleanup.",
  authError: authError.message,
})
\`\`\`

## User Update Flow

### Process Overview

1. User submits the update form with modified information
2. The application sends a PATCH request to `/api/users/[id]`
3. The server updates the user record in the `users` table
4. The server returns the updated user

### Implementation Details

The user update process updates the user record in the database:

\`\`\`typescript
const { data, error } = await supabase
  .from("users")
  .update({
    name: userData.name,
    role_id: userData.role_id,
  })
  .eq("id", id)
  .select(`
    id,
    email,
    name,
    role_id,
    role:roles(id, name)
  `)
  .single()
\`\`\`

## Error Handling

The user management system implements comprehensive error handling:

1. **Validation Errors**:
   - Checks for required fields
   - Returns appropriate error messages

2. **Auth Errors**:
   - Handles errors from Supabase Auth
   - Provides detailed error information

3. **Database Errors**:
   - Handles errors from database operations
   - Includes error details, hints, and codes

4. **Fallback Mechanisms**:
   - Continues with database operations even if auth operations fail
   - Provides warnings when partial operations succeed

5. **Cleanup**:
   - Attempts to clean up auth records if database operations fail
   - Logs cleanup failures for manual intervention

## Security Considerations

### Password Handling

1. **Auth System**:
   - Passwords are securely handled by Supabase Auth
   - Never stored in plain text

2. **Database Storage**:
   - Passwords are hashed before storage
   - Stored only to satisfy database constraints
   - Not used for authentication

\`\`\`typescript
// Hash the password for database storage
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}
\`\`\`

### Permission Levels

1. **Admin Operations**:
   - Use the service role key
   - Required for creating and deleting users in Auth

2. **Regular Operations**:
   - Use the anon key
   - Sufficient for most database operations

### Error Messages

Error messages are carefully crafted to:
- Provide useful information for debugging
- Not expose sensitive information
- Include different levels of detail based on the environment

## Troubleshooting

### Common Issues

1. **"User not allowed" Error**:
   - **Cause**: Using the regular client for admin operations
   - **Solution**: Ensure the service role key is available and the admin client is being used

2. **"null value in column 'password' violates not-null constraint" Error**:
   - **Cause**: Not including a password in the database insert
   - **Solution**: Ensure a hashed password is included in the insert operation

3. **Auth Deletion Failures**:
   - **Cause**: Insufficient permissions or missing service role key
   - **Solution**: Check that the service role key is available and has the necessary permissions

### Debugging

The API includes extensive logging to help diagnose issues:

\`\`\`typescript
console.log(`[API] POST /api/users: Creating new user:`, {
  ...userData,
  password: userData.password ? "********" : undefined,
})
\`\`\`

Logs include:
- Operation type and endpoint
- Input data (with sensitive information redacted)
- Error details, including message, code, and hint
- Success confirmations

### Manual Interventions

In some cases, manual intervention may be required:

1. **Orphaned Auth Records**:
   - Use the Supabase dashboard to delete auth users
   - Look for users that exist in auth but not in the database

2. **Orphaned Database Records**:
   - Use the database interface to delete user records
   - Look for users that exist in the database but not in auth

3. **Email Verification Issues**:
   - Use the Supabase dashboard to manually verify users
   - Resend verification emails if needed
\`\`\`

Let's also update the main development guide to reference the new user management documentation:
