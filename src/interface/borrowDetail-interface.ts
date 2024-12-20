import { Optional, Model } from "sequelize";

// Interface utama untuk entitas BorrowDetail
export interface IBorrowDetail {
  borrowDetailId: string;
  borrowId: string;
  inventoryId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface untuk query saat mencari BorrowDetail
export interface IFindBorrowDetailQuery {
  where: {
    [key: string]: string | number;
  };
  order?: any;
  raw?: boolean;
  returning: boolean;
}

// Interface untuk data yang diperlukan dalam pembuatan BorrowDetail
export interface IBorrowDetailCreationBody
  extends Optional<
    IBorrowDetail,
    | "borrowDetailId"
    | "createdAt"
    | "updatedAt"
    | "borrowId"
    | "inventoryId"
    | "status"
  > {}

// Interface model Sequelize yang menggabungkan IBorrowDetail dan metode Sequelize Model
export interface IBorrowDetailModel
  extends Model<IBorrowDetail, IBorrowDetailCreationBody>,
    IBorrowDetail {}

// Interface untuk data source BorrowDetail (repository pattern)
export interface IBorrowDetailDataSource {
  fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null>;
  fetchAll(query: IFindBorrowDetailQuery): Promise<IBorrowDetail[] | null>;
  create(record: IBorrowDetailCreationBody): Promise<IBorrowDetail>;
  updateOne(
    searchBy: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void>;
  deleteOne(query: IFindBorrowDetailQuery): Promise<void>;
}
