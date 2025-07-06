/**
 * Inventory routes
 * Handles inventory-related API endpoints
 */
import express, { Request, Response, NextFunction } from "express";
import InventoryController from "../controller/inventory-controller";
import { container } from "tsyringe";

const router = express.Router();
const inventoryController = container.resolve(InventoryController);

/**
 * Async error handler wrapper for route handlers
 * @param fn - Route handler function
 * @returns Wrapped route handler with error handling
 */
const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(500).json({
        status: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    });
  };

// Fetch all Inventories route
router.get(
  "/inventories",
  asyncHandler(inventoryController.fetchAllInventory.bind(inventoryController)),
);

export default router;
