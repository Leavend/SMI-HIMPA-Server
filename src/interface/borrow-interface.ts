import { Optional, Model, IncludeOptions } from "sequelize";
import { IInventory } from "./inventory-interface";
import { IUser } from "./user-interface";

// Interface utama untuk entitas Borrow
export interface IBorrow {
  borrowId: string;
  quantity: number;
  dateBorrow: Date;
  dateReturn: Date | null;
  userId: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

import { IBorrowDetail } from "./borrowDetail-interface";

export interface IBorrowWithDetails extends IBorrow {
  borrowDetails?: (IBorrowDetail & {
    inventory?: IInventory; // Pastikan ini ada
  })[];
  user?: IUser;
}

// Interface untuk query saat mencari Borrow
export interface IFindBorrowQuery {
  where: Record<string, unknown>; // This remains for the search condition
  include?: IncludeOptions[]; // Allow for Sequelize includes
  order?: any[]; // Define the ordering of records
  raw?: boolean;
  returning: boolean;
}

// Interface untuk data yang diperlukan dalam pembuatan Borrow
export interface IBorrowCreationBody
  extends Optional<IBorrow, "borrowId" | "createdAt" | "updatedAt"> {}

// Interface model Sequelize yang menggabungkan IBorrow dan metode Sequelize Model
export interface IBorrowModel
  extends Model<IBorrow, IBorrowCreationBody>,
    IBorrow {}

// Interface untuk data source Borrow (repository pattern)
export interface IBorrowDataSource {
  fetchOne(query: IFindBorrowQuery): Promise<IBorrow | null>;
  fetchAll(query: IFindBorrowQuery): Promise<IBorrow[] | null>;
  create(record: IBorrowCreationBody): Promise<IBorrow>;
  updateOne(searchBy: IFindBorrowQuery, data: Partial<IBorrow>): Promise<void>;
  deleteOne(query: IFindBorrowQuery): Promise<void>;
}
