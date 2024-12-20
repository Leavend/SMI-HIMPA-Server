import { Optional, Model } from "sequelize";

export interface IUser {
  userId: string;
  username: string;
  email: string;
  number: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFindUserQuery {
  where: {
    [key: string]: string;
  };
  order?: any;
  raw?: boolean;
  returning: boolean;
}

export interface IUserCreationBody
  extends Optional<IUser, "userId" | "createdAt" | "updatedAt"> {}

export interface IUserModel extends Model<IUser, IUserCreationBody>, IUser {}

export interface IUserDataSource {
  fetchOne(query: IFindUserQuery): Promise<IUser | null>;
  create(record: IUserCreationBody): Promise<IUser>;
  updateOne(searchBy: IFindUserQuery, data: Partial<IUser>): Promise<void>;
}
