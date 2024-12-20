import {
  IFindInventoryQuery,
  IInventory,
  IInventoryCreationBody,
  IInventoryDataSource,
} from "../interface/inventory-interface";
import InventoryModel from "../model/inventory-model";

class InventoryDataSource implements IInventoryDataSource {
  async create(record: IInventoryCreationBody): Promise<IInventory> {
    return await InventoryModel.create(record);
  }

  async fetchOne(query: IFindInventoryQuery): Promise<IInventory | null> {
    return await InventoryModel.findOne(query);
  }

  async fetchAll(query: IFindInventoryQuery): Promise<IInventory[] | null> {
    return await InventoryModel.findAll(query);
  }

  async updateOne(
    searchBy: IFindInventoryQuery,
    data: Partial<IInventory>,
  ): Promise<void> {
    await InventoryModel.update(data, searchBy);
  }

  // Tambahkan metode deleteOne
  async deleteOne(query: IFindInventoryQuery): Promise<void> {
    await InventoryModel.destroy(query);
  }
}

export default InventoryDataSource;
