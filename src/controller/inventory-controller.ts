import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import {
  IInventoryCreationBody,
  IFindInventoryQuery,
} from "../interface/inventory-interface";
import InventoryService from "../service/inventory-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";

@autoInjectable()
class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // Create a new inventory item
  async addInventory(req: Request, res: Response) {
    try {
      const newInventory = req.body as IInventoryCreationBody;

      const inventoryExists = await this.inventoryService.getInventoryByField({
        code: newInventory.code,
      });
      if (inventoryExists) {
        return Utility.handleError(
          res,
          "Inventory item with this code already exists",
          ResponseCode.ALREADY_EXIST,
        );
      }

      const inventory =
        await this.inventoryService.createInventory(newInventory);
      return Utility.handleSuccess(
        res,
        "Inventory item created successfully",
        { inventory },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Fetch all inventory items
  async fetchAllInventory(req: Request, res: Response) {
    try {
      const inventories = await this.inventoryService.getAllInventories();
      return Utility.handleSuccess(
        res,
        "Inventories fetched successfully",
        { inventories },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Update an inventory item
  async modifyInventory(req: Request, res: Response) {
    try {
      const inventoryId = Utility.escapeHtml(req.params.id);
      const inventoryExists = await this.inventoryService.getInventoryByField({
        inventoryId,
      });

      if (!inventoryExists) {
        return Utility.handleError(
          res,
          "Inventory item not found",
          ResponseCode.NOT_FOUND,
        );
      }

      if (!req.body || !Object.keys(req.body).length) {
        return Utility.handleError(
          res,
          "Request body is empty or invalid",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Prepare update data with strict validation
      const updateData = { ...req.body };

      // Enhanced quantity-condition validation
      if ("quantity" in updateData || "condition" in updateData) {
        const newQuantity =
          "quantity" in updateData
            ? Number(updateData.quantity)
            : inventoryExists.quantity;

        const requestedCondition =
          "condition" in updateData
            ? updateData.condition
            : inventoryExists.condition;

        // Prevent invalid Out of Stock status
        if (requestedCondition === "Out of Stock" && newQuantity !== 0) {
          return Utility.handleError(
            res,
            "Cannot set Out of Stock status when quantity is not zero",
            ResponseCode.BAD_REQUEST,
          );
        }

        // Auto-update logic
        if ("quantity" in updateData) {
          if (newQuantity <= 0) {
            updateData.condition = "Out of Stock";
            updateData.lastStockUpdate = new Date();
          } else if (
            inventoryExists.condition === "Out of Stock" &&
            newQuantity > 0
          ) {
            updateData.condition = "Available";
            updateData.lastStockUpdate = new Date();
          }
        }
      }

      // Final validation before update
      if (
        updateData.condition === "Out of Stock" &&
        (updateData.quantity ?? inventoryExists.quantity) !== 0
      ) {
        return Utility.handleError(
          res,
          "System detected invalid Out of Stock status. Quantity must be zero.",
          ResponseCode.BAD_REQUEST,
        );
      }

      const inventoryModify = await this.inventoryService.updateInventoryRecord(
        { inventoryId },
        updateData,
      );

      return Utility.handleSuccess(
        res,
        "Inventory item updated successfully",
        { inventoryModify },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Error modifying inventory:", error);
      return Utility.handleError(
        res,
        "An unexpected error occurred",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Delete an inventory item
  async removeInventory(req: Request, res: Response) {
    try {
      const inventoryExists = await this.inventoryService.getInventoryByField({
        inventoryId: req.params.id,
      });
      if (!inventoryExists) {
        return Utility.handleError(
          res,
          "Inventory item not found",
          ResponseCode.NOT_FOUND,
        );
      }

      await this.inventoryService.deleteInventory({
        inventoryId: req.params.id,
      });
      return Utility.handleSuccess(
        res,
        "Inventory item deleted successfully",
        {},
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }
}

export default InventoryController;
