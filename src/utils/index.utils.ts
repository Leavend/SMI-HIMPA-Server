import { Response } from "express";
import { createLogger, format, transports } from "winston";

// Types
interface ApiResponse {
  status: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// Logger configuration
const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
          (info) => `${info.timestamp} ${info.level} : ${info.message}`,
        ),
      ),
    }),
  ],
});

/**
 * Format phone number for WhatsApp API
 * @param number - Phone number to format
 * @returns Formatted phone number for WhatsApp
 * @throws Error if phone number format is invalid
 */
const formatPhoneNumberToWhatsApp = (number: string): string => {
  const cleanedNumber = number.replace(/\D/g, "");

  if (cleanedNumber.startsWith("0")) {
    return `62${cleanedNumber.slice(1)}@c.us`;
  }

  if (cleanedNumber.startsWith("62")) {
    return `${cleanedNumber}@c.us`;
  }

  throw new Error("Invalid phone number format");
};

/**
 * Print text in red color to console
 * @param text - Text to print
 */
const printRed = (text: string): void => {
  console.log("\x1b[31m%s\x1b[0m", `${text} \n`);
};

/**
 * Escape HTML special characters
 * @param html - HTML string to escape
 * @returns Escaped HTML string
 */
const escapeHtml = (html: string): string => {
  return html.replace(/[&<>"']/g, "");
};

/**
 * Check if data is empty or null
 * @param data - Data to check
 * @returns True if data is empty, false otherwise
 */
const isEmpty = (data: unknown): boolean => {
  if (data === null || data === undefined) {
    return true;
  }

  if (typeof data === "string") {
    return data.trim().length === 0;
  }

  if (Array.isArray(data)) {
    return data.length === 0;
  }

  if (typeof data === "object") {
    return Object.keys(data).length === 0;
  }

  return false;
};

/**
 * Handle API error responses
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns Express response
 */
const handleError = (
  res: Response,
  message: string,
  statusCode = 400,
): Response => {
  logger.error(message);
  const response: ApiResponse = { status: false, message };
  return res.status(statusCode).json(response);
};

/**
 * Handle API success responses
 * @param res - Express response object
 * @param message - Success message
 * @param data - Response data
 * @param statusCode - HTTP status code
 * @returns Express response
 */
const handleSuccess = (
  res: Response,
  message: string,
  data: Record<string, unknown> = {},
  statusCode = 200,
): Response => {
  const response: ApiResponse = { status: true, message, data };
  return res.status(statusCode).json(response);
};

/**
 * Generate a random code with specified length
 * @param length - Length of the code to generate
 * @returns Generated random code
 */
const generateCode = (length = 15): string => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  let result = randomness + dateString;
  result = result.length > length ? result.substring(0, length) : result;
  return result.toUpperCase();
};

/**
 * Parse string to object with retry logic
 * @param value - String value to parse
 * @returns Parsed object
 * @throws Error if parsing fails after retries
 */
const parseToObject = (value: string): Record<string, unknown> => {
  let counter = 0;
  const maxRetries = 2;

  try {
    let data = JSON.parse(value);

    while (counter <= maxRetries) {
      if (typeof data === "object" && data !== null) {
        return data;
      }
      data = JSON.parse(data);
      counter += 1;
    }

    throw new Error("Failed to parse string to object after maximum retries");
  } catch (error) {
    throw new Error(
      `JSON parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// Export utility functions
const Utility = {
  printRed,
  handleError,
  handleSuccess,
  generateCode,
  isEmpty,
  escapeHtml,
  parseToObject,
  formatPhoneNumberToWhatsApp,
};

export default Utility;
