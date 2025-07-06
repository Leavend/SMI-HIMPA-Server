/**
 * Token Data Source
 * Handles token data operations with the database
 */
import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
  ITokenDataSource,
} from "../interface/token-interface";
import TokenModel from "../model/token-model";

class TokenDataSource implements ITokenDataSource {
  /**
   * Create a new token record
   */
  async create(record: ITokenCreationBody): Promise<IToken> {
    return TokenModel.create(record);
  }

  /**
   * Fetch a single token record based on search criteria
   */
  async fetchOne(query: IFindTokenQuery): Promise<IToken | null> {
    return TokenModel.findOne(query);
  }

  /**
   * Update a single token record based on search criteria
   */
  async updateOne(
    data: Partial<IToken>,
    query: IFindTokenQuery,
  ): Promise<void> {
    await TokenModel.update(data, query);
  }
}

export default TokenDataSource;
