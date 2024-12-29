import { autoInjectable } from "tsyringe";
import {
  IFindInventoryQuery,
  IInventory,
  IInventoryCreationBody,
} from "../interface/inventory-interface";
import InventoryDataSource from "../datasource/inventory-datasource";

@autoInjectable()
class InventoryService {
  constructor(private inventoryDataSource: InventoryDataSource) {}

  async getAllInventoriesWithQuery(
    query: IFindInventoryQuery,
  ): Promise<IInventory[] | null> {
    return this.inventoryDataSource.fetchAll(query);
  }

  async getInventoryByField(
    record: Partial<IInventory>,
  ): Promise<IInventory | null> {
    const query: IFindInventoryQuery = {
      where: { ...record },
      raw: true,
      returning: false,
    };
    return this.inventoryDataSource.fetchOne(query);
  }

  async getAllInventories(): Promise<IInventory[] | null> {
    const query: IFindInventoryQuery = {
      where: {},
      order: [["createdAt", "DESC"]],
      raw: true,
      returning: false,
    };
    return this.inventoryDataSource.fetchAll(query);
  }

  async createInventory(record: IInventoryCreationBody): Promise<IInventory> {
    return this.inventoryDataSource.create(record);
  }

  async updateInventoryRecord(
    searchBy: Partial<IInventory>,
    record: Partial<IInventory>,
    transaction?: any,
  ): Promise<void> {
    const query: IFindInventoryQuery = {
      where: { ...searchBy },
      returning: false,
    };
    await this.inventoryDataSource.updateOne(query, record);
  }

  async deleteInventory(searchBy: Partial<IInventory>): Promise<void> {
    const query: IFindInventoryQuery = {
      where: { ...searchBy },
      returning: false,
    };
    await this.inventoryDataSource.deleteOne(query);
  }
}

export default InventoryService;
