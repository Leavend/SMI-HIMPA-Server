import "reflect-metadata";

import "./src/container";
import express, { Request, Response, Express, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { container } from "tsyringe";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import fs from "fs";

// Models
import BorrowModel from "./src/model/borrow-model";
import BorrowDetailModel from "./src/model/borrowDetail-model";
import InventoryModel from "./src/model/inventory-model";
import UserModel from "./src/model/user-model";

// Database and Routes
import DbInitialize from "./src/database/init";
import UserRouter from "./src/routes/user-routes";
import BorrowRouter from "./src/routes/borrow-routes";
import InventoryRouter from "./src/routes/inventory-routes";
import AdminRouter from "./src/routes/admin-routes";
import ReturnRouter from "./src/routes/return-routes";

// Constants and Configurations
import { APP_CONFIG } from "./src/config/app-config";
import logger from "./src/utils/logger";

// Register dependencies
container.register("BorrowModel", { useValue: BorrowModel });
container.register("BorrowDetailModel", { useValue: BorrowDetailModel });
container.register("InventoryModel", { useValue: InventoryModel });
container.register("UserModel", { useValue: UserModel });

// Load environment variables
dotenv.config({ path: APP_CONFIG.envFilePath });

class App {
  private app: Express;
  private whatsappClient: Client;

  constructor() {
    this.app = express();
    this.whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: './wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Enable trust proxy
    this.app.set('trust proxy', true);
    
    // Security middleware
    this.app.use(helmet());
    // this.app.use(cors({
    //   origin: APP_CONFIG.corsOrigin,
    //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
    //   allowedHeaders: ['Content-Type', 'Authorization']
    // }));

    this.app.use(cors({
      origin: '*', // Allow all origins (not recommended for production)
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }));

    // Rate limiting with proxy validation
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later',
      validate: { trustProxy: true }
    });
    this.app.use(limiter);

    // Request logging
    const accessLogStream = fs.createWriteStream(
      path.join(__dirname, 'access.log'),
      { flags: 'a' }
    );
    this.app.use(morgan('combined', { stream: accessLogStream }));

    // Body parsing
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // Compression
    this.app.use(compression());
  }

  private configureRoutes(): void {
    // API routes
    this.app.use("/api/user", UserRouter);
    this.app.use("/api/borrow", BorrowRouter);
    this.app.use("/api/inventory", InventoryRouter);
    this.app.use("/api/admin", AdminRouter);
    this.app.use("/api/return", ReturnRouter);

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'healthy' });
    });

    // Welcome endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.send(`Welcome to ${APP_CONFIG.appName}`);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ message: 'Route not found' });
    });
  }

  private configureErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error: ${err.message}`, { stack: err.stack });
      
      if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ 
          status: false, 
          message: 'Invalid JSON payload' 
        });
        return;
      }

      res.status(err.status || 500).json({
        status: false,
        message: err.message || 'Internal Server Error',
        ...(APP_CONFIG.env === 'development' && { stack: err.stack })
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.message || reason}`);
      // Consider restarting the process in production
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
      process.exit(1); // Mandatory in production
    });
  }

  private initializeWhatsAppClient(): void {
    this.whatsappClient.on("qr", (qr) => {
      logger.info("No existing session. Scan the QR code to authenticate WhatsApp.");
      qrcode.generate(qr, { small: true });
    });
  
    this.whatsappClient.on("authenticated", () => {
      logger.info("WhatsApp authenticated successfully.");
    });
  
    this.whatsappClient.on("ready", () => {
      logger.info("WhatsApp client is ready and connected.");
    });
  
    this.whatsappClient.on("auth_failure", (msg) => {
      logger.error("WhatsApp authentication failed. Reason:", msg);
    });
  
    this.whatsappClient.on("disconnected", (reason) => {
      logger.warn("WhatsApp client disconnected:", reason);
    });
  
    this.whatsappClient.initialize().catch(error => {
      logger.error("Failed to initialize WhatsApp client:", error);
    });
  }
  

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await DbInitialize();

      // Initialize WhatsApp client
      this.initializeWhatsAppClient();

      // Start Express server
      this.app.listen(APP_CONFIG.port, () => {
        logger.info(`Server running on port ${APP_CONFIG.port}`);
        logger.info(`Environment: ${APP_CONFIG.env}`);
        logger.info("Database connection established successfully.");
      });

    } catch (error) {
      logger.error("Failed to start application:", error);
      process.exit(1);
    }
  }

  public getApp(): Express {
    return this.app;
  }

  public getWhatsAppClient(): Client {
    return this.whatsappClient;
  }
}

// Create and start the application
const application = new App();
application.start();

export default application;
export const whatsappClient = application.getWhatsAppClient();