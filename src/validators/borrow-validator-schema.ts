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
    ["PENDING", "REJECTED", "RETURNED"],
    "Status must be either 'pending', 'rejected', or 'returned'",
  );

// Skema validasi untuk membuat peminjaman
const createBorrowSchema = yup.object({
  quantity: positiveInteger.required("Quantity is required"),
  dateBorrow: yup
    .date()
    .min(new Date(), "Borrow date cannot be in the past") // Memastikan tanggal minimal adalah hari ini
    .required("Borrow date is required"),
  dateReturn: yup
    .date()
    .min(yup.ref("dateBorrow"), "Return date cannot be before borrow date") // Memastikan tanggal kembali setelah tanggal pinjam
    .nullable(), // Optional, jika belum dikembalikan
  userId: requiredString("User ID"),
  adminId: yup.string().trim().nullable(), // Optional, jika admin belum mengatur pengembalian
});

// Skema validasi untuk memperbarui peminjaman
const updateBorrowSchema = yup.object({
  quantity: positiveInteger,
  status: statusValidation.trim(),
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
      ["ACTIVE", "REJECTED", "RETURNED"],
      "Status must be either 'active' or 'rejected' 'returned'",
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
