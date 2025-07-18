import "reflect-metadata";
import "./container";
import express, { Request, Response, Express, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { container } from "tsyringe";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import fs from "fs";

// Models
import BorrowModel from "./model/borrow-model";
import BorrowDetailModel from "./model/borrowDetail-model";
import InventoryModel from "./model/inventory-model";
import UserModel from "./model/user-model";

// Database and Routes
import UserRouter from "./routes/user-routes";
import BorrowRouter from "./routes/borrow-routes";
import InventoryRouter from "./routes/inventory-routes";
import AdminRouter from "./routes/admin-routes";
import ReturnRouter from "./routes/return-routes";

// Constants and Configurations
import { APP_CONFIG } from "./config/app-config";
import logger from "./utils/logger";

dotenv.config({ path: APP_CONFIG.envFilePath });

// Register dependencies
container.register("BorrowModel", { useValue: BorrowModel });
container.register("BorrowDetailModel", { useValue: BorrowDetailModel });
container.register("InventoryModel", { useValue: InventoryModel });
container.register("UserModel", { useValue: UserModel });

const app: Express = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: APP_CONFIG.corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);
const limiter = rateLimit({
  windowMs: APP_CONFIG.api.rateLimit.windowMs,
  max: APP_CONFIG.api.rateLimit.max,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "../access.log"),
  { flags: "a" },
);
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// Routes
app.use("/api/user", UserRouter);
app.use("/api/borrow", BorrowRouter);
app.use("/api/inventory", InventoryRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/return", ReturnRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});
app.get("/", (_req: Request, res: Response) => {
  res.send(`Welcome to ${APP_CONFIG.appName}`);
});
// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(
  (
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ status: false, message: "Invalid JSON payload" });
      return;
    }
    res.status(err.status || 500).json({
      status: false,
      message: err.message || "Internal Server Error",
      ...(APP_CONFIG.env === "development" && { stack: err.stack }),
    });
  },
);

export default app;