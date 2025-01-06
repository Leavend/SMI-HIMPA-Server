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
      // Get the inventory ID and escape any HTML in it
      const inventoryId = Utility.escapeHtml(req.params.id);
      // Check if the inventory item exists
      const inventoryExists = await this.inventoryService.getInventoryByField({
        inventoryId,
      });
      // If no inventory item is found, return an error response
      if (!inventoryExists) {
        return Utility.handleError(
          res,
          "Inventory item not found",
          ResponseCode.NOT_FOUND,
        );
      }

      // Check if the request body has necessary fields for update
      if (!req.body || !Object.keys(req.body).length) {
        return Utility.handleError(
          res,
          "Request body is empty or invalid",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Update the inventory record with the provided data
      const inventoryModify = await this.inventoryService.updateInventoryRecord(
        { inventoryId },
        req.body,
      );

      // Return success response after the update
      return Utility.handleSuccess(
        res,
        "Inventory item updated successfully",
        { inventoryModify },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      // Improved error handling
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
