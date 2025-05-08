// src/config/app-config.ts
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Application configuration constants
export const APP_CONFIG = {
  // Application settings
  appName: process.env.APPNAME || 'Himpa',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  envFilePath: '.env',

  // Database configuration
  db: {
    host: process.env.DB_HOST || 'sql.freedb.tech',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'freedb_roothimpa',
    password: process.env.DB_PASSWORD || '%u6A?QBs9cx$HKD',
    database: process.env.DB_NAME || 'freedb_himpa_2024',
    dialect: process.env.DB_DIALECT || 'mysql',
    alter: process.env.DB_ALTER === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },

  // Security configuration
  jwt: {
    secret: process.env.JWT_KEY || 'aaaaaaa',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Email configuration
  email: {
    sendGridApiKey: process.env.SENDGRID_API_KEY || 'aaa',
    mailUser: process.env.MAIL_USER || 'tiohadybayu@gmail.com',
    mailPass: process.env.MAIL_PASS || 'bqlf eexi abcz pnya',
    supportMail: process.env.SUPPORTMAIL || 'himpa2024@gmail.com',
  },

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // WhatsApp configuration
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    adminNumber: process.env.WHATSAPP_ADMIN_NUMBER || '',
  },

  // API configuration
  api: {
    prefix: '/api',
    version: 'v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
} as const;

// Export type for TypeScript usage
export type AppConfig = typeof APP_CONFIG;