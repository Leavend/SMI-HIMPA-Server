import * as yup from "yup";

/**
 * Reusable validation rules for user-related fields
 */

/**
 * Username validation rule
 * - Minimum 3 characters
 * - Maximum 50 characters
 * - Required field
 */
const usernameRule = yup
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(50, "Username must be at most 50 characters long")
  .trim()
  .required("Username is required");

/**
 * Email validation rule
 * - Valid email format
 * - Converted to lowercase
 * - Required field
 */
const emailRule = yup
  .string()
  .email("Invalid email format")
  .lowercase()
  .trim()
  .required("Email is required");

/**
 * Password validation rule
 * - Minimum 6 characters
 * - Required field
 */
const passwordRule = yup
  .string()
  .min(6, "Password must be at least 6 characters long")
  .trim()
  .required("Password is required");

/**
 * Phone number validation rule
 * - Only digits allowed
 * - Minimum 10 digits
 * - Maximum 15 digits
 * - Required field
 */
const numberRule = yup
  .string()
  .matches(/^\d+$/, "Number must contain only digits")
  .min(10, "Number must be at least 10 digits long")
  .max(15, "Number must be at most 15 digits long")
  .required("Number is required");

/**
 * Validation schema for user registration
 */
const registerSchema = yup.object({
  username: usernameRule,
  email: emailRule,
  password: passwordRule,
  number: numberRule,
});

/**
 * Validation schema for user login
 */
const loginSchema = yup.object({
  username: yup.string().lowercase().trim().required("Username is required"),
  password: passwordRule,
});

/**
 * Validation schema for forgot password request
 */
const forgotPasswordSchema = yup.object({
  email: emailRule,
});

/**
 * Validation schema for password reset
 */
const resetPasswordSchema = yup.object({
  code: yup.string().trim().required("Reset code is required"),
  email: emailRule,
  password: passwordRule,
});

/**
 * Combined validation schemas for user operations
 */
const ValidationSchema = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

export default ValidationSchema;
