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
  private inventoryService: InventoryService;

  constructor(_inventoryService: InventoryService) {
    this.inventoryService = _inventoryService;
  }

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

  // Fetch a specific inventory by code or other field
  // async fetchInventory(req: Request, res: Response) {
  //   try {
  //     const query = req.query as unknown as IFindInventoryQuery;
  //     const inventory =
  //       await this.inventoryService.getAllInventoriesWithQuery(query);
  //     if (!inventory) {
  //       return Utility.handleError(
  //         res,
  //         "Inventory item not found",
  //         ResponseCode.NOT_FOUND,
  //       );
  //     }
  //     return Utility.handleSuccess(
  //       res,
  //       "Inventory fetched successfully",
  //       { inventory },
  //       ResponseCode.SUCCESS,
  //     );
  //   } catch (error) {
  //     return Utility.handleError(
  //       res,
  //       (error as TypeError).message,
  //       ResponseCode.SERVER_ERROR,
  //     );
  //   }
  // }

  // Update an inventory item
  async modifyInventory(req: Request, res: Response) {
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

      await this.inventoryService.updateInventoryRecord(
        { inventoryId: req.params.id },
        req.body,
      );
      return Utility.handleSuccess(
        res,
        "Inventory item updated successfully",
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
