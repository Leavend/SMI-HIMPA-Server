import express, { Request, Response, Router } from "express";
import InventoryController from "../controller/inventory-controller";
import { Auth } from "../middlewares/index.middleware";
import { container } from "tsyringe";

// Inject the InventoryController dependency using tsyringe DI container
const inventoryController = container.resolve(InventoryController);

const createInventoryRoute = (): Router => {
  const router = express.Router();

  // Fetch all Inventories route
  router.get("/inventories", Auth(), async (req: Request, res: Response) => {
    return inventoryController.fetchAllInventory(req, res);
  });

  // Fetch Inventory Quantities route
  router.get("/quantities", Auth(), async (req: Request, res: Response) => {
    return inventoryController.fetchInventoryQuantities(req, res);
  });

  // Fetch Inventory by code or other field
  router.get("/search", Auth(), async (req: Request, res: Response) => {
    return inventoryController.fetchInventory(req, res);
  });

  // Fetch a single Inventory by ID
  router.get("/", Auth(), async (req: Request, res: Response) => {
    return inventoryController.fetchInventoryById(req, res);
  });

  return router;
};

export default createInventoryRoute();
