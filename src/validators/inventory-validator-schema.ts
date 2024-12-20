import * as yup from "yup";

// Common validation rules
const nameValidation = yup
  .string()
  .min(3, "Name must be at least 3 characters long")
  .max(100, "Name must be at most 100 characters long")
  .trim();

const quantityValidation = yup
  .number()
  .positive("Quantity must be a positive number")
  .integer("Quantity must be an integer");

const conditionValidation = yup
  .string()
  .oneOf(
    ["Available", "Out of Stock", "Reserved", "Damaged", "Discontinued"],
    "Condition must be either 'Available', 'Out of Stock', 'Reserved', 'Damaged', or 'Discontinued'"
  );

const codeValidation = yup
  .string()
  .min(3, "Code must be at least 3 characters long")
  .max(20, "Code must be at most 20 characters long")
  .trim();

// Skema validasi untuk membuat inventaris
const createInventorySchema = yup.object({
  name: nameValidation.required("Name is required"),
  quantity: quantityValidation.required("Quantity is required"),
  condition: yup.string().oneOf(["Available"], "Condition must be 'Available'"),
  code: codeValidation.required("Code is required"),
});

// Skema validasi untuk memperbarui inventaris
const updateInventorySchema = yup.object({
  inventoryId: yup.string().trim().required("Inventory ID is required"),
  name: nameValidation,
  quantity: quantityValidation,
  condition: conditionValidation,
});

// Skema validasi untuk mencari inventaris
const searchInventorySchema = yup.object({
  inventoryId: yup.string().trim(),
  code: yup.string().trim(),
});

// Menggabungkan semua skema validasi ke dalam satu objek
const ValidationSchema = {
  createInventorySchema,
  updateInventorySchema,
  searchInventorySchema,
};

export default ValidationSchema;
