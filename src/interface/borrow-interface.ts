import { Optional, Model } from "sequelize";

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

// Interface untuk query saat mencari Borrow
export interface IFindBorrowQuery {
  where: {
    [key: string]: string | number | Date | null;
  };
  order?: any;
  raw?: boolean;
  returning: boolean;
}

// Interface untuk data yang diperlukan dalam pembuatan Borrow
export interface IBorrowCreationBody
  extends Optional<
    IBorrow,
    "borrowId" | "createdAt" | "updatedAt" | "dateReturn"
  > {}
  
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
  // getBorrowByField(field: {
  //   [key: string]: string | number;
  // }): Promise<IBorrow[] | null>; // New method
}
