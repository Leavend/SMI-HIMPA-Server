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
import qrcode from "qrcode";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

export const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/chromium-browser", // Railway tidak menyediakan default Chromium
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

// Simpan QR Code ke dalam file agar bisa diakses oleh client
const saveQRCode = async (qr: string) => {
  const qrPath = path.join(__dirname, "qrcode.png");
  await qrcode.toFile(qrPath, qr);
};

// Endpoint untuk mendapatkan QR Code
app.get("/qrcode", (req: Request, res: Response) => {
  const qrPath = path.join(__dirname, "qrcode.png");
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    res.status(404).json({ message: "QR Code belum dibuat" });
  }
});

const initializeWhatsAppClient = () => {
  whatsappClient.on("qr", async (qr) => {
    await saveQRCode(qr);
    console.log("Scan the QR code by accessing /qrcode endpoint.");
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
