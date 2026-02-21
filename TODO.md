## Auth Routes

### POST USER

- Validate create user Email
- Send verification email

### PATCH USER

- Create new route to patch user

## Transaction Routes

## UserSchema

- Add `isActive` bool for email verification
- Cascade delete users categories/transactions/accounts

## AccountSchema

### DELETE

- Cascade delete accounts transactions

## Infrastructure

- Error handling middleware
