/**
 * Return entity interfaces
 */
import { Optional, Model } from "sequelize";
import { IBorrowDetail } from "./borrowDetail-interface";
import { IInventory } from "./inventory-interface";
import { IUser } from "./user-interface";

/**
 * Main interface for Return entity
 */
export interface IReturn {
  returnId: string;
  borrowId: string;
  quantity: number;
  dateBorrow: Date;
  dateReturn: Date;
  lateDays: number;
  createdAt: Date;
  updatedAt: Date;
  borrow?: {
    borrowDetails?: (IBorrowDetail & {
      inventory?: Pick<IInventory, "name">;
    })[];
    user?: Pick<IUser, "username">;
  };
}

/**
 * Interface for Return search queries
 */
export interface IFindReturnQuery {
  where: {
    [key: string]: string | number;
  };
  order?: any;
  raw?: boolean;
  returning?: boolean;
}

/**
 * Interface for Return creation data
 */
export interface IReturnCreationBody
  extends Optional<
    IReturn,
    | "returnId"
    | "createdAt"
    | "updatedAt"
    | "dateBorrow"
    | "dateReturn"
    | "lateDays"
  > {}

/**
 * Sequelize model interface combining IReturn and Sequelize Model methods
 */
export interface IReturnModel
  extends Model<IReturn, IReturnCreationBody>,
    IReturn {}

/**
 * Interface for Return data source (repository pattern)
 */
export interface IReturnDataSource {
  fetchOne(query: IFindReturnQuery): Promise<IReturn | null>;
  fetchAll(query: IFindReturnQuery): Promise<IReturn[] | null>;
  create(record: IReturnCreationBody): Promise<IReturn>;
  updateOne(searchBy: IFindReturnQuery, data: Partial<IReturn>): Promise<void>;
  deleteOne(query: IFindReturnQuery): Promise<void>;
}
