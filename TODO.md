## Auth Routes

### POST USER

- Validate create user Email
- Send verification email

### PATCH USER

- Create new route to patch user

## Transaction Routes

### POST

- Update linked accounts balance on post Transaction
- Normalize input dates to YYYY-MM-DD | YY-MM-DD reject others

### PATCH

- Patch transaction ensure `inflow && outflow !== 0`
- Update account balance on patch Transaction

## UserSchema

- Add `isActive` bool for email verification
- Cascade delete users categories/transactions/accounts

## AccountSchema

### DELETE

- Cascade delete accounts transactions

## Infrastructure

- Error handling middleware
