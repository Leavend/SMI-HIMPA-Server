import express, { Request, Response, Router } from "express";
import InventoryController from "../controller/inventory-controller";
import { Auth } from "../middlewares/index.middleware";
import { container } from "tsyringe";

const router = express.Router();
const inventoryController = container.resolve(InventoryController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createInventoryRoute = () => {
  // Fetch all Inventories route
  router.get(
    "/inventories",
    asyncHandler(
      inventoryController.fetchAllInventory.bind(inventoryController),
    ),
  );

  // // Fetch Inventory by code or other field
  // router.get("/search", Auth(), async (req: Request, res: Response) => {
  //   return inventoryController.fetchInventory(req, res);
  // });

  return router;
};

export default createInventoryRoute();
