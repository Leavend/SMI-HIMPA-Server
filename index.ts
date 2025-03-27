import "reflect-metadata";
import express, { Request, Response, Express, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import DbInitialize from "./src/database/init";
import DashboardRouter from "./src/routes/dashboard-routes";
import UserRouter from "./src/routes/user-routes";
import BorrowRouter from "./src/routes/borrow-routes";
import InventoryRouter from "./src/routes/inventory-routes";
import AdminRouter from "./src/routes/admin-routes";
import ReturnRouter from "./src/routes/return-routes";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

dotenv.config({ path: ".env" });

// Export client for use in other services or controllers
export const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-extensions",
    ],
  },
});

const app: Express = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err) {
    res.status(500).json({ status: false, message: err.message });
  } else {
    next();
  }
});

app.use("/api/", DashboardRouter);
app.use("/api/user", UserRouter);
app.use("/api/borrow", BorrowRouter);
app.use("/api/inventory", InventoryRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/return", ReturnRouter);

app.get("/", (req: Request, res: Response) => {
  res.send(`Welcome to ${process.env.APPNAME}`);
});

const PORT = process.env.PORT || 4300;

const initializeWhatsAppClient = () => {
  whatsappClient.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Scan the QR code to authenticate with WhatsApp.");
  });

  whatsappClient.on("ready", () => {
    console.log("WhatsApp client is ready!");
  });

  whatsappClient.on("authenticated", () => {
    console.log("WhatsApp client authenticated!");
  });

  whatsappClient.on("auth_failure", (msg) => {
    console.error("Authentication failure:", msg);
  });

  whatsappClient.initialize();
};

const Bootstrap = async () => {
  try {
    await DbInitialize();
    initializeWhatsAppClient();
    app.listen(PORT, () => {
      console.log("Express server is running on port", PORT);
      console.log("Connection has been established successfully.");
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

Bootstrap();