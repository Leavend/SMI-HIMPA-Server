/**
 * Inventory Data Source
 * Handles inventory data operations with the database
 */
import { autoInjectable } from "tsyringe";
import {
  IFindInventoryQuery,
  IInventory,
  IInventoryCreationBody,
  IInventoryDataSource,
} from "../interface/inventory-interface";
import InventoryModel from "../model/inventory-model";

@autoInjectable()
class InventoryDataSource implements IInventoryDataSource {
  /**
   * Create a new inventory record
   */
  async create(record: IInventoryCreationBody): Promise<IInventory> {
    return InventoryModel.create(record);
  }

  /**
   * Fetch a single inventory record based on search criteria
   */
  async fetchOne(query: IFindInventoryQuery): Promise<IInventory | null> {
    return InventoryModel.findOne(query);
  }

  /**
   * Fetch all inventory records based on search criteria
   */
  async fetchAll(query: IFindInventoryQuery): Promise<IInventory[] | null> {
    return InventoryModel.findAll(query);
  }

  /**
   * Update a single inventory record based on search criteria
   */
  async updateOne(
    searchBy: IFindInventoryQuery,
    data: Partial<IInventory>,
  ): Promise<void> {
    await InventoryModel.update(data, searchBy);
  }

  /**
   * Delete a single inventory record based on search criteria
   */
  async deleteOne(query: IFindInventoryQuery): Promise<void> {
    await InventoryModel.destroy(query);
  }
}

export default InventoryDataSource;
