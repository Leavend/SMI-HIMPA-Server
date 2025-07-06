/**
 * Token entity interfaces
 */
import { Optional, Model } from "sequelize";

/**
 * Main interface for Token entity
 */
export interface IToken {
  id: string;
  key: string;
  code: string;
  type: string;
  expires: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for Token search queries
 */
export interface IFindTokenQuery {
  where: {
    [key: string]: string;
  };
  raw?: boolean;
  returning: boolean;
}

/**
 * Interface for Token creation data
 */
export interface ITokenCreationBody
  extends Optional<IToken, "id" | "createdAt" | "updatedAt"> {}

/**
 * Sequelize model interface combining IToken and Sequelize Model methods
 */
export interface ITokenModel
  extends Model<IToken, ITokenCreationBody>,
    IToken {}

/**
 * Interface for Token data source (repository pattern)
 */
export interface ITokenDataSource {
  fetchOne(query: IFindTokenQuery): Promise<IToken | null>;
  create(record: ITokenCreationBody): Promise<IToken>;
  updateOne(data: Partial<IToken>, query: IFindTokenQuery): Promise<void>;
}
