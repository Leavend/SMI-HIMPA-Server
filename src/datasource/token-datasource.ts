import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
  ITokenDataSource,
} from "../interface/token-interface";
import TokenModel from "../model/token-model";

class TokenDataSource implements ITokenDataSource {
  async create(record: ITokenCreationBody): Promise<IToken> {
    return TokenModel.create(record);
  }

  async fetchOne(query: IFindTokenQuery): Promise<IToken | null> {
    return TokenModel.findOne(query);
  }

  async updateOne(
    data: Partial<IToken>,
    query: IFindTokenQuery,
  ): Promise<void> {
    await TokenModel.update(data, query);
  }
}

export default TokenDataSource;
