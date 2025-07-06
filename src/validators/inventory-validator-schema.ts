import * as yup from "yup";

/**
 * Common validation rules for inventory-related fields
 */

/**
 * Name validation rule
 * - Minimum 3 characters
 * - Maximum 100 characters
 * - Trimmed
 */
const nameValidation = yup
  .string()
  .min(3, "Name must be at least 3 characters long")
  .max(100, "Name must be at most 100 characters long")
  .trim();

/**
 * Quantity validation rule
 * - Must be a positive number
 * - Must be an integer
 */
const quantityValidation = yup
  .number()
  .positive("Quantity must be a positive number")
  .integer("Quantity must be an integer");

/**
 * Condition validation rule
 * - Must be one of the predefined conditions
 */
const conditionValidation = yup
  .string()
  .oneOf(
    ["Available", "Out of Stock", "Reserved", "Damaged", "Discontinued"],
    "Condition must be either 'Available', 'Out of Stock', 'Reserved', 'Damaged', or 'Discontinued'",
  );

/**
 * Code validation rule
 * - Minimum 3 characters
 * - Maximum 20 characters
 * - Trimmed
 */
const codeValidation = yup
  .string()
  .min(3, "Code must be at least 3 characters long")
  .max(20, "Code must be at most 20 characters long")
  .trim();

/**
 * Validation schema for creating inventory
 */
const createInventorySchema = yup.object({
  name: nameValidation.required("Name is required"),
  quantity: quantityValidation.required("Quantity is required"),
  condition: yup.string().oneOf(["Available"], "Condition must be 'Available'"),
  code: codeValidation.required("Code is required"),
});

/**
 * Validation schema for updating inventory
 */
const updateInventorySchema = yup.object({
  name: nameValidation,
  quantity: quantityValidation,
  condition: conditionValidation,
});

/**
 * Validation schema for searching inventory
 */
const searchInventorySchema = yup.object({
  inventoryId: yup.string().trim(),
  code: yup.string().trim(),
});

/**
 * Combined validation schemas for inventory operations
 */
const ValidationSchema = {
  createInventorySchema,
  updateInventorySchema,
  searchInventorySchema,
};

export default ValidationSchema;
