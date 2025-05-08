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
    .typeError('Harap masukkan tanggal yang valid')
    .required("Tanggal pinjam harus diisi")
    .test(
      'not-past-date',
      'Tanggal pinjam tidak boleh di masa lalu',
      (value) => {
        if (!value) return false;
        
        // Bandingkan hanya tanggal (YYYY-MM-DD) tanpa waktu
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const inputDate = new Date(value);
        const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
        
        return inputDateOnly >= todayDate;
      }
    ),
  dateReturn: yup
    .date()
    .nullable()
    .min(
      yup.ref("dateBorrow"), 
      "Tanggal kembali tidak boleh sebelum tanggal pinjam"
    )
    .typeError('Harap masukkan tanggal yang valid'),
  userId: requiredString("User ID"),
  adminId: yup.string().trim().nullable(),
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
