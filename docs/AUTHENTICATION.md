# Authentication System

This document describes the authentication and authorization system used in the Recipe Management application.

## Overview

The application uses Supabase Auth for authentication, with a custom implementation that allows users to log in with a username instead of an email. Role-based access control is implemented to restrict access to different parts of the application based on user roles.

## Authentication Flow

1. **Login Process**:
   - User enters username and password on the login page
   - The system looks up the email associated with the username in the database
   - The email and password are used to authenticate with Supabase Auth
   - Upon successful authentication, the user's complete profile (including role) is fetched
   - The user is redirected to the appropriate dashboard based on their role

2. **Session Management**:
   - Sessions are managed by Supabase Auth
   - The application checks for an existing session on load
   - A listener is set up to handle auth state changes (login, logout, etc.)
   - The auth context provides the current user state to the entire application

## User Roles and Permissions

The application supports the following roles:

1. **ADMIN**:
   - Has access to all features and pages
   - Can manage users, recipes, inventory, orders, and menu items

2. **CHEF**:
   - Has access to recipes and inventory
   - Can view, create, and edit recipes
   - Can manage inventory levels

3. **STAFF**:
   - Has limited access based on their specific role
   - Typically can view recipes and manage orders

## Implementation Details

### Username-based Login

The application uses a custom approach to allow username-based login while still using Supabase Auth's email-based system:

1. When a user attempts to log in with a username, the system:
   - Looks up the email associated with the username in the database
   - Uses that email to authenticate with Supabase Auth
   - Returns the session to the client

2. User creation process:
   - When creating a user, both username and email are collected
   - The username is stored in the `name` field of the users table
   - The email is used for Supabase Auth

### Role-based Access Control

Access control is implemented at multiple levels:

1. **Navigation**: The main navigation component only shows items the user has permission to access
2. **Route Protection**: Protected routes check the user's role before rendering
3. **API Endpoints**: API endpoints verify permissions before processing requests

### Security Considerations

1. **Password Storage**:
   - Passwords are managed by Supabase Auth and are not directly accessible
   - A hashed version of the password is stored in the database for schema compliance

2. **Session Management**:
   - Sessions are managed securely by Supabase Auth
   - Session tokens are stored in cookies with appropriate security settings

3. **Error Handling**:
   - Login errors provide minimal information to prevent username enumeration
   - Detailed errors are logged server-side for debugging

## Troubleshooting

### Common Issues

1. **"Invalid username or password"**:
   - Check that the username exists in the database
   - Verify that the password is correct
   - Ensure the user has not been disabled

2. **Access Denied to Pages**:
   - Verify the user's role in the database
   - Check that the role has the necessary permissions
   - Ensure the route is properly configured in the permissions system

3. **Session Expiration**:
   - Sessions expire after a period of inactivity
   - Users will be automatically redirected to the login page
