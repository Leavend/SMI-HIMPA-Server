import {
  IFindInventoryQuery,
  IInventory,
  IInventoryCreationBody,
  IInventoryDataSource,
} from "../interface/inventory-interface";
import InventoryModel from "../model/inventory-model";

class InventoryDataSource implements IInventoryDataSource {
  async create(record: IInventoryCreationBody): Promise<IInventory> {
    return InventoryModel.create(record);
  }

  async fetchOne(query: IFindInventoryQuery): Promise<IInventory | null> {
    return InventoryModel.findOne(query);
  }

  async fetchAll(query: IFindInventoryQuery): Promise<IInventory[] | null> {
    return InventoryModel.findAll(query);
  }

  async updateOne(
    searchBy: IFindInventoryQuery,
    data: Partial<IInventory>,
  ): Promise<void> {
    await InventoryModel.update(data, searchBy);
  }

  async deleteOne(query: IFindInventoryQuery): Promise<void> {
    await InventoryModel.destroy(query);
  }
}

export default InventoryDataSource;
