/**
 * User entity interfaces
 */
import { Optional, Model } from "sequelize";

/**
 * Main interface for User entity
 */
export interface IUser {
  userId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  number: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for User search queries
 */
export interface IFindUserQuery {
  where: {
    [key: string]: string;
  };
  raw?: boolean;
  returning: boolean;
}

/**
 * Interface for User creation data
 */
export interface IUserCreationBody
  extends Optional<IUser, "userId" | "createdAt" | "updatedAt"> {}

/**
 * Sequelize model interface combining IUser and Sequelize Model methods
 */
export interface IUserModel extends Model<IUser, IUserCreationBody>, IUser {}

/**
 * Interface for User data source (repository pattern)
 */
export interface IUserDataSource {
  fetchOne(query: IFindUserQuery): Promise<IUser | null>;
  fetchAll(query: IFindUserQuery): Promise<IUser[] | null>;
  create(record: IUserCreationBody): Promise<IUser>;
  updateOne(searchBy: IFindUserQuery, data: Partial<IUser>): Promise<void>;
}
