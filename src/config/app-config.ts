/**
 * Application configuration constants and types
 * @module config/app-config
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

/**
 * Application configuration object
 * @constant
 */
export const APP_CONFIG = {
  appName: process.env.APPNAME || "Himpa",
  env: process.env.NODE_ENV || "development",
  port: Number.parseInt(process.env.PORT || "5000", 10),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",
  envFilePath: ".env",
  db: {
    host: process.env.DB_HOST || "",
    port: Number.parseInt(process.env.DB_PORT || "3306", 10),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    dialect: process.env.DB_DIALECT || "mysql",
    alter: process.env.DB_ALTER === "true",
    logging: process.env.DB_LOGGING === "true",
  },
  jwt: {
    secret: process.env.JWT_KEY || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  email: {
    sendGridApiKey: process.env.SENDGRID_API_KEY || "",
    mailUser: process.env.MAIL_USER || "",
    mailPass: process.env.MAIL_PASS || "",
    supportMail: process.env.SUPPORTMAIL || "",
  },
  corsOrigin: process.env.CORS_ORIGIN || "*",
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    adminNumber: process.env.WHATSAPP_ADMIN_NUMBER || "",
  },
  api: {
    prefix: "/api",
    version: "v1",
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
