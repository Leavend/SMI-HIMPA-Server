# User Deletion Solution

## Problem
When trying to delete a user that has related `Borrow` records, the system would throw a foreign key constraint error:

```
Cannot delete or update a parent row: a foreign key constraint fails 
(`freedb_himpa_2024`.`Borrows`, CONSTRAINT `Borrows_ibfk_1` 
FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`))
```

## Root Cause
The `Borrows` table has a foreign key constraint that references the `Users` table. When a user is deleted, the database prevents the deletion if there are any `Borrow` records that reference them, to maintain referential integrity.

## Solution Implemented

### Application-Level Solution (Recommended)
The solution adds a `cascade` parameter to the delete endpoint that provides two options:

#### Option A: Safe Delete (Default)
- **Endpoint**: `DELETE /api/admin/user/{id}`
- **Behavior**: Checks for related `Borrow` records and prevents deletion if any exist
- **Response**: Returns a clear error message indicating the number of related records

#### Option B: Cascade Delete
- **Endpoint**: `DELETE /api/admin/user/{id}?cascade=true`
- **Behavior**: Deletes all related `Borrow` records first, then deletes the user
- **Response**: Confirms successful deletion of both user and related records

## Code Changes

### 1. UserDataSource (`src/datasource/user-datasource.ts`)
- Added `@autoInjectable()` decorator for dependency injection
- Added `deleteOne` method to handle user deletion

### 2. UserService (`src/service/user-service.ts`)
- Added `BorrowDataSource` dependency injection
- Added `deleteUser` method to accept a `cascade` parameter
- Added logic to check for related `Borrow` records
- Implemented cascade deletion when requested

### 3. UserController (`src/controller/user-controller.ts`)
- Added `deleteUser` method to handle the `cascade` query parameter
- Added specific error handling for foreign key constraint violations
- Updated success messages to reflect cascade deletion

### 4. Admin Routes (`src/routes/admin-routes.ts`)
- Added `DELETE /api/admin/user/:id` route with `AdminAuth()` middleware

### 5. User Interface (`src/interface/user-interface.ts`)
- Updated `IFindUserQuery` to support any type in where clause
- Added `deleteOne` method to `IUserDataSource` interface

### 6. Tests (`src/test/user-delete.test.ts`)
- Added comprehensive tests for the new functionality
- Tests both safe delete and cascade delete scenarios
- Verifies proper error handling and authentication

## Usage Examples

### Safe Delete (Recommended for most cases)
```bash
curl -X DELETE "http://localhost:3000/api/admin/user/user-id-here" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (if related records exist):**
```json
{
  "status": false,
  "message": "Cannot delete user because they have 3 related borrow record(s). Use cascade=true to delete related records as well.",
  "code": 400
}
```

### Cascade Delete (Use with caution)
```bash
curl -X DELETE "http://localhost:3000/api/admin/user/user-id-here?cascade=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "status": true,
  "message": "User and related borrow records deleted successfully",
  "data": {},
  "code": 200
}
```

## Database Schema Relationships

The foreign key constraints involved are:

1. **Borrows → Users**: `Borrows.user_id` references `Users.user_id`
2. **Borrows → BorrowDetails**: `BorrowDetails.borrow_id` references `Borrows.borrow_id`
3. **BorrowDetails → Inventories**: `BorrowDetails.inventory_id` references `Inventories.inventory_id`

This means:
- Deleting a `User` record requires handling related `Borrow` records
- Deleting a `Borrow` record requires handling related `BorrowDetails` records
- Deleting an `Inventory` record requires handling related `BorrowDetails` records

## Benefits

1. **Data Integrity**: Prevents accidental deletion of users with active borrow records
2. **User Control**: Provides clear options for handling related data
3. **Clear Error Messages**: Users understand why deletion failed and how to proceed
4. **Audit Trail**: Cascade deletion is explicit and logged
5. **Flexibility**: Supports both safe and aggressive deletion strategies
6. **Security**: Only admin users can delete users

## Security Considerations

1. **Admin Authorization Required**: All user deletion endpoints require admin privileges
2. **Input Sanitization**: User IDs are sanitized using `Utility.escapeHtml()`
3. **Error Handling**: Sensitive error details are not exposed to clients
4. **Transaction Safety**: Cascade deletions are handled carefully to maintain data consistency
5. **Role-Based Access**: Only users with ADMIN role can perform deletions

## Recommendations

1. **Use Safe Delete by Default**: The default behavior prevents accidental data loss
2. **Implement Confirmation UI**: When cascade deletion is requested, show a confirmation dialog
3. **Log Cascade Deletions**: Consider adding audit logs for cascade deletions
4. **Consider Soft Delete**: For critical data, consider implementing soft delete instead of hard delete
5. **Test Thoroughly**: Ensure cascade deletion works correctly in all scenarios
6. **Backup Before Deletion**: Always backup data before performing cascade deletions

## Testing

Run the tests to verify the functionality:

```bash
npm test -- --testNamePattern="User Delete API"
```

## Related Solutions

This solution follows the same pattern as the [Inventory Deletion Solution](./INVENTORY_DELETE_SOLUTION.md) and [Borrow Deletion Solution](./BORROW_DELETE_SOLUTION.md), providing consistency across the application.

## Future Enhancements

1. **Soft Delete**: Consider implementing soft delete for user records to maintain audit trails
2. **Bulk Operations**: Add support for bulk deletion with cascade options
3. **Audit Logging**: Implement comprehensive audit logging for all deletion operations
4. **Recovery Options**: Add ability to restore deleted users (if using soft delete)
5. **Email Notifications**: Send notifications to users before their account is deleted
6. **Data Export**: Allow users to export their data before deletion

## API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| DELETE | `/api/admin/user/:id` | Admin | Delete user (safe delete) |
| DELETE | `/api/admin/user/:id?cascade=true` | Admin | Delete user and related records |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - User ID missing or foreign key constraint |
| 401 | Unauthorized - No valid admin token |
| 403 | Forbidden - User is not an admin |
| 404 | Not Found - User doesn't exist |
| 500 | Internal Server Error - Unexpected error | 