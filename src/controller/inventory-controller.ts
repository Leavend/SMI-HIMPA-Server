/**
 * Inventory Controller
 * Handles inventory CRUD operations
 */
import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { IInventoryCreationBody } from "../interface/inventory-interface";
import InventoryService from "../service/inventory-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";

@autoInjectable()
class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  /**
   * Create a new inventory item
   */
  async addInventory(req: Request, res: Response): Promise<Response> {
    try {
      const newInventory = req.body as IInventoryCreationBody;
      const inventoryExists = await this.inventoryService.getInventoryByField({
        code: newInventory.code,
      });
      if (inventoryExists) {
        return Utility.handleError(
          res,
          "Barang dengan kode ini sudah terdaftar",
          ResponseCode.ALREADY_EXIST,
        );
      }
      const inventory =
        await this.inventoryService.createInventory(newInventory);
      return Utility.handleSuccess(
        res,
        "Barang berhasil ditambahkan",
        { inventory },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Kesalahan server internal",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch all inventory items
   */
  async fetchAllInventory(_req: Request, res: Response): Promise<Response> {
    try {
      const inventories = await this.inventoryService.getAllInventories();
      return Utility.handleSuccess(
        res,
        "Data inventaris berhasil diambil",
        { inventories },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Kesalahan server internal",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Update an inventory item
   */
  async modifyInventory(req: Request, res: Response): Promise<Response> {
    try {
      const inventoryId = Utility.escapeHtml(req.params.id);
      const inventoryExists = await this.inventoryService.getInventoryByField({
        inventoryId,
      });
      if (!inventoryExists) {
        return Utility.handleError(
          res,
          "Barang tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }
      if (!req.body || !Object.keys(req.body).length) {
        return Utility.handleError(
          res,
          "Data permintaan kosong atau tidak valid",
          ResponseCode.BAD_REQUEST,
        );
      }
      const updateData = { ...req.body };
      if ("quantity" in updateData || "condition" in updateData) {
        const newQuantity =
          "quantity" in updateData
            ? Number(updateData.quantity)
            : inventoryExists.quantity;
        const requestedCondition =
          "condition" in updateData
            ? updateData.condition
            : inventoryExists.condition;
        if (requestedCondition === "Out of Stock" && newQuantity !== 0) {
          return Utility.handleError(
            res,
            "Tidak dapat mengatur status Habis jika jumlah tidak nol",
            ResponseCode.BAD_REQUEST,
          );
        }
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
      if (
        updateData.condition === "Out of Stock" &&
        (updateData.quantity ?? inventoryExists.quantity) !== 0
      ) {
        return Utility.handleError(
          res,
          "Sistem mendeteksi status Habis tidak valid. Jumlah harus nol.",
          ResponseCode.BAD_REQUEST,
        );
      }
      const inventoryModify = await this.inventoryService.updateInventoryRecord(
        { inventoryId },
        updateData,
      );
      return Utility.handleSuccess(
        res,
        "Barang berhasil diperbarui",
        { inventoryModify },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "Terjadi kesalahan yang tidak terduga",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Delete an inventory item
   */
  async removeInventory(req: Request, res: Response): Promise<Response> {
    try {
      const inventoryExists = await this.inventoryService.getInventoryByField({
        inventoryId: req.params.id,
      });
      if (!inventoryExists) {
        return Utility.handleError(
          res,
          "Barang tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      // Check if cascade parameter is provided
      const cascade = req.query.cascade === "true";

      await this.inventoryService.deleteInventory(
        {
          inventoryId: req.params.id,
        },
        cascade,
      );

      const message = cascade
        ? "Barang dan detail peminjaman terkait berhasil dihapus"
        : "Barang berhasil dihapus";

      return Utility.handleSuccess(res, message, {}, ResponseCode.SUCCESS);
    } catch (error) {
      // Handle foreign key constraint error specifically
      if (
        error instanceof Error &&
        error.message.includes("Tidak dapat menghapus barang karena masih memiliki")
      ) {
        return Utility.handleError(
          res,
          error.message,
          ResponseCode.BAD_REQUEST,
        );
      }

      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Kesalahan server internal",
        ResponseCode.SERVER_ERROR,
      );
    }
  }
}

export default InventoryController;
