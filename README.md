# Mess Management System Backend

Express and MongoDB API with separate authentication and user profile modules.

## Structure

- `src/controllers/auth.controller.js`: signup, login, password recovery/change, JWT generation and legacy credential migration.
- `src/routes/auth.routes.js`: authentication endpoints.
- `src/models/auth.model.js`: password hashing/comparison and reset OTP storage, linked to a User through a unique `user` reference.
- `src/controllers/user.controller.js`: profile retrieval, updates and avatar upload.
- `src/routes/user.routes.js`: authenticated profile endpoints.
- `src/models/user.model.js`: profile fields, email and role.
- `src/middleware/authmiddleware.js`: bearer authentication and owner/admin authorization.

## API

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Public; new accounts always receive the user role |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/forgot-password` | Public; email required |
| POST | `/api/v1/auth/verify-otp` | Public; email and OTP required |
| POST | `/api/v1/auth/update-password` | Public; email, OTP and newPassword required |
| POST | `/api/v1/auth/reset-password` | Logged in; oldPassword, newPassword and confirmPassword required |
| GET | `/api/v1/users/:id` | Owner or admin |
| PUT | `/api/v1/users/update-user/:id` | Owner or admin; updates the specified user |
| POST | `/api/v1/users/update-avatar` | Logged in; own avatar, multipart field `avatar` |

Send `Authorization: Bearer <token>` for protected endpoints. Authentication URLs previously under `/api/v1/users` have moved to `/api/v1/auth`; update frontend clients accordingly. Request field names and successful response shapes remain the same.

## Existing users

New registrations create a User profile and a linked Auth record. If Auth creation fails, registration attempts to remove the newly created profile.

Existing credentials migrate lazily when login or a password operation first reads them. The existing bcrypt hash and reset OTP fields are copied to the Auth collection without rehashing. Legacy fields are removed from the User document only after an Auth record exists. Inactive accounts retain their legacy credentials until first use; profile queries explicitly exclude these fields.

Existing user IDs and JWT subjects remain unchanged. Deploy this version consistently across server instances: old application instances expect credentials in the User collection and cannot handle migrated accounts. Keep a database backup before deployment; rolling back requires restoring credentials to the old schema.

## Run

Configure MongoDB, JWT, Cloudinary and email environment variables used in `src/config/config.js`, then run `npm run dev` or `npm start`.
