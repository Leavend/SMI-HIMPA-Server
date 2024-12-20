import { Optional, Model } from "sequelize";

export interface IInventory {
  inventoryId: string;
  name: string;
  quantity: number;
  condition: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFindInventoryQuery {
  where: {
    [key: string]: string | number | Date;
  };
  order?: any;
  raw?: boolean;
  returning: boolean;
}

export interface IInventoryCreationBody
  extends Optional<IInventory, "inventoryId" | "createdAt" | "updatedAt"> {}

export interface IInventoryModel
  extends Model<IInventory, IInventoryCreationBody>,
    IInventory {}

export interface IInventoryDataSource {
  fetchOne(query: IFindInventoryQuery): Promise<IInventory | null>;
  fetchAll(query: IFindInventoryQuery): Promise<IInventory[] | null>;
  create(record: IInventoryCreationBody): Promise<IInventory>;
  updateOne(
    searchBy: IFindInventoryQuery,
    data: Partial<IInventory>,
  ): Promise<void>;
  deleteOne(query: IFindInventoryQuery): Promise<void>;
}
