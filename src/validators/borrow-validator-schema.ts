import * as yup from "yup";

/**
 * Common validation rules for borrow-related fields
 */

/**
 * Positive integer validation rule
 * - Must be a positive number
 * - Must be an integer
 */
const positiveInteger = yup
  .number()
  .positive("Quantity must be a positive number")
  .integer("Quantity must be an integer");

/**
 * Required string validation rule factory
 * @param field - Field name for error message
 * @returns Yup string validation rule
 */
const requiredString = (field: string) =>
  yup.string().trim().required(`${field} is required`);

/**
 * Status validation rule
 * - Must be one of: PENDING, REJECTED, RETURNED
 */
const statusValidation = yup
  .string()
  .oneOf(
    ["PENDING", "REJECTED", "RETURNED"],
    "Status must be either 'pending', 'rejected', or 'returned'",
  );

/**
 * Validation schema for creating a borrow record
 */
const createBorrowSchema = yup.object({
  quantity: positiveInteger.required("Quantity is required"),
  dateBorrow: yup
    .date()
    .typeError("Please enter a valid date")
    .required("Borrow date is required")
    .test("not-past-date", "Borrow date cannot be in the past", (value) => {
      if (!value) return false;

      // Compare only date (YYYY-MM-DD) without time
      const today = new Date();
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const inputDate = new Date(value);
      const inputDateOnly = new Date(
        inputDate.getFullYear(),
        inputDate.getMonth(),
        inputDate.getDate(),
      );

      return inputDateOnly >= todayDate;
    }),
  dateReturn: yup
    .date()
    .nullable()
    .min(yup.ref("dateBorrow"), "Return date cannot be before borrow date")
    .typeError("Please enter a valid date"),
  userId: requiredString("User ID"),
  adminId: yup.string().trim().nullable(),
});

/**
 * Validation schema for updating a borrow record
 */
const updateBorrowSchema = yup.object({
  quantity: positiveInteger,
  status: statusValidation.trim(),
});

/**
 * Validation schema for searching borrow records
 */
const searchBorrowSchema = yup.object({
  borrowId: yup.string().trim(),
  userId: yup.string().trim(),
  status: statusValidation.trim(),
});

/**
 * Validation schema for approving or declining borrow requests
 */
const approveDeclineBorrowSchema = yup.object({
  borrowId: requiredString("Borrow ID"),
  status: yup
    .string()
    .oneOf(
      ["ACTIVE", "REJECTED", "RETURNED"],
      "Status must be either 'active', 'rejected', or 'returned'",
    )
    .required("Status is required"),
});

/**
 * Combined validation schemas for borrow operations
 */
const BorrowValidationSchema = {
  createBorrowSchema,
  updateBorrowSchema,
  searchBorrowSchema,
  approveDeclineBorrowSchema,
};

export default BorrowValidationSchema;
