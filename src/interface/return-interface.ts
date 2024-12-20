import { Optional, Model } from "sequelize";

// Interface utama untuk entitas Return
export interface IReturn {
  returnId: string;
  borrowId: string;
  quantity: number;
  dateBorrow: Date;
  dateReturn: Date;
  lateDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface untuk query saat mencari Return
export interface IFindReturnQuery {
  where: {
    [key: string]: string | number;
  };
  order?: any;
  raw?: boolean;
  returning?: boolean;
}

// Interface untuk data yang diperlukan dalam pembuatan Return
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

// Interface model Sequelize yang menggabungkan IReturn dan metode Sequelize Model
export interface IReturnModel
  extends Model<IReturn, IReturnCreationBody>,
    IReturn {}

// Interface untuk data source Return (repository pattern)
export interface IReturnDataSource {
  fetchOne(query: IFindReturnQuery): Promise<IReturn | null>;
  fetchAll(query: IFindReturnQuery): Promise<IReturn[] | null>;
  create(record: IReturnCreationBody): Promise<IReturn>;
  updateOne(searchBy: IFindReturnQuery, data: Partial<IReturn>): Promise<void>;
  deleteOne(query: IFindReturnQuery): Promise<void>;
}
