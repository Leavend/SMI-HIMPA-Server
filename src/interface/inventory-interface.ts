/**
 * Inventory entity interfaces
 */
import { Optional, Model } from "sequelize";

/**
 * Main interface for Inventory entity
 */
export interface IInventory {
  inventoryId: string;
  name: string;
  code: string;
  quantity: number;
  condition: string;
  lastStockUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for Inventory search queries
 */
export interface IFindInventoryQuery {
  where: {
    [key: string]: string | number;
  };
  raw?: boolean;
  returning: boolean;
}

/**
 * Interface for Inventory creation data
 */
export interface IInventoryCreationBody
  extends Optional<IInventory, "inventoryId" | "createdAt" | "updatedAt"> {}

/**
 * Sequelize model interface combining IInventory and Sequelize Model methods
 */
export interface IInventoryModel
  extends Model<IInventory, IInventoryCreationBody>,
    IInventory {}

/**
 * Interface for Inventory data source (repository pattern)
 */
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
