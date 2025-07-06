/**
 * Borrow Detail entity interfaces
 */
import { Optional, Model, IncludeOptions } from "sequelize";
import { IInventory } from "./inventory-interface";

/**
 * Main interface for Borrow Detail entity
 */
export interface IBorrowDetail {
  borrowDetailId: string;
  borrowId: string;
  inventoryId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  inventory?: IInventory;
}

/**
 * Interface for Borrow Detail search queries
 */
export interface IFindBorrowDetailQuery {
  where: Record<string, unknown>;
  include?: IncludeOptions[];
  order?: any[];
  raw?: boolean;
  returning: boolean;
}

/**
 * Interface for Borrow Detail creation data
 */
export interface IBorrowDetailCreationBody
  extends Optional<
    IBorrowDetail,
    "borrowDetailId" | "createdAt" | "updatedAt"
  > {}

/**
 * Sequelize model interface combining IBorrowDetail and Sequelize Model methods
 */
export interface IBorrowDetailModel
  extends Model<IBorrowDetail, IBorrowDetailCreationBody>,
    IBorrowDetail {}

/**
 * Interface for Borrow Detail data source (repository pattern)
 */
export interface IBorrowDetailDataSource {
  fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null>;
  fetchAll(query: IFindBorrowDetailQuery): Promise<IBorrowDetail[] | null>;
  create(record: IBorrowDetailCreationBody): Promise<IBorrowDetail>;
  updateOne(
    query: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void>;
  deleteOne(query: IFindBorrowDetailQuery): Promise<void>;
}
