import * as yup from "yup";

// Common validation rules
const positiveInteger = yup
  .number()
  .positive("Quantity must be a positive number")
  .integer("Quantity must be an integer");

const requiredString = (field: string) =>
  yup.string().trim().required(`${field} is required`);

const statusValidation = yup
  .string()
  .oneOf(
    ["pending", "approved", "returned"],
    "Status must be either 'pending', 'approved', or 'returned'",
  );

// Skema validasi untuk membuat peminjaman
const createBorrowSchema = yup.object({
  quantity: positiveInteger.required("Quantity is required"),
  dateBorrow: yup
    .date()
    .max(new Date(), "Borrow date cannot be in the future")
    .required("Borrow date is required"),
  dateReturn: yup
    .date()
    .min(yup.ref("dateBorrow"), "Return date cannot be before borrow date")
    .nullable(), // Optional, jika belum dikembalikan
  userId: requiredString("User ID"),
  adminId: yup.string().trim().nullable(), // Optional, jika admin belum menetapkan pengembalian
});

// Skema validasi untuk memperbarui peminjaman
const updateBorrowSchema = yup.object({
  quantity: positiveInteger,
  dateReturn: yup
    .date()
    .min(yup.ref("dateBorrow"), "Return date cannot be before borrow date")
    .nullable(),
  status: statusValidation.nullable(),
});

// Skema validasi untuk mencari peminjaman
const searchBorrowSchema = yup.object({
  borrowId: yup.string().trim(),
  userId: yup.string().trim(),
  status: statusValidation.trim(),
});

// Skema validasi untuk accept or reject peminjaman
const approveDeclineBorrowSchema = yup.object({
  borrowId: requiredString("Borrow ID"),
  status: yup
    .string()
    .oneOf(
      ["ACTIVE", "REJECTED"],
      "Status must be either 'active' or 'rejected'",
    )
    .required("Status is required"),
});

// Menggabungkan semua skema validasi ke dalam satu objek
const BorrowValidationSchema = {
  createBorrowSchema,
  updateBorrowSchema,
  searchBorrowSchema,
  approveDeclineBorrowSchema,
};

export default BorrowValidationSchema;
