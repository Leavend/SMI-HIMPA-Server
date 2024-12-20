import { Response } from "express";
import { createLogger, format, transports } from "winston";

// Utility function to format phone numbers for WhatsApp
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

// Utility function to print text in red
const printRed = (text: string): void => {
  console.log("\x1b[31m%s\x1b[0m", `${text} \n`);
};

// Logger configuration
const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
          (info) => `${info.timestamp} ${info.level} : ${info.message}`
        )
      ),
    }),
  ],
});

// Utility function to escape HTML
const escapeHtml = (html: string): string => {
  return html.replace(/[&<>"']/g, "");
};

// Utility function to check if data is empty
const isEmpty = (data: any): boolean => {
  return (
    !data ||
    data.length === 0 ||
    typeof data === "undefined" ||
    data === null ||
    Object.keys(data).length === 0
  );
};

// Utility function to handle errors
const handleError = (
  res: Response,
  message: string,
  statusCode: number = 400
): Response => {
  logger.error(message);
  return res.status(statusCode).json({ status: false, message });
};

// Utility function to handle success responses
const handleSuccess = (
  res: Response,
  message: string,
  data: object = {},
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({ status: true, message, data });
};

// Utility function to generate a random code
const generateCode = (num: number = 15): string => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  let result = randomness + dateString;
  result = result.length > num ? result.substring(0, num) : result;
  return result.toUpperCase();
};

// Utility function to parse a string to an object
const parseToObject = (value: string): any => {
  let counter = 0;
  let data = JSON.parse(value);
  while (counter <= 2) {
    if (typeof data === "object") {
      break;
    } else {
      data = JSON.parse(data);
      counter++;
    }
  }
  return data;
};

// Exporting all utility functions as a single object
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
