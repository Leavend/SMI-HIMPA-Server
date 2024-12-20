import * as yup from "yup";

// Reusable validation rules
const usernameRule = yup
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(50, "Username must be at most 50 characters long")
  .trim()
  .required("Username is required");

const emailRule = yup
  .string()
  .email("Invalid email format")
  .lowercase()
  .trim()
  .required("Email is required");

const passwordRule = yup
  .string()
  .min(6, "Password must be at least 6 characters long")
  .trim()
  .required("Password is required");

const numberRule = yup
  .string()
  .matches(/^\d+$/, "Number must contain only digits")
  .min(10, "Number must be at least 10 digits long")
  .max(15, "Number must be at most 15 digits long")
  .required("Number is required");

// Validation schema for registration
const registerSchema = yup.object({
  username: usernameRule,
  email: emailRule,
  password: passwordRule,
  number: numberRule,
});

// Validation schema for login
const loginSchema = yup.object({
  username: yup.string().lowercase().trim().required("Username is required"),
  password: passwordRule,
});

// Validation schema for forgot password
const forgotPasswordSchema = yup.object({
  email: emailRule,
});

// Validation schema for reset password
const resetPasswordSchema = yup.object({
  code: yup.string().trim().required("Reset code is required"),
  email: emailRule,
  password: passwordRule,
});

// Combine all validation schemas into one object
const ValidationSchema = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

export default ValidationSchema;
