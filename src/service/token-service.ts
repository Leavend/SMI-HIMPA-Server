import moment from "moment";
import { autoInjectable } from "tsyringe";

import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
} from "../interface/token-interface";
import Utility from "../utils/index.utils";
import TokenDataSource from "../datasource/token-datasource";

@autoInjectable()
class TokenService {
  private tokenDataSource: TokenDataSource;
  private readonly tokenExpires: number;
  public readonly TokenTypes = {
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
  };
  public readonly TokenStatus = {
    NOTUSED: "NOTUSED",
    USED: "USED",
  };

  constructor(_tokenDataSource: TokenDataSource) {
    this.tokenDataSource = _tokenDataSource;
    this.tokenExpires = parseInt(process.env.TOKEN_EXPIRES_MINUTES || "5", 10);
  }

  async getTokenByField(record: Partial<IToken>): Promise<IToken | null> {
    const query = { where: { ...record }, raw: true } as IFindTokenQuery;
    try {
      return await this.tokenDataSource.fetchOne(query);
    } catch (error) {
      console.error("Error fetching token by field:", error);
      throw error;
    }
  }

  async createForgotPasswordToken(email: string): Promise<IToken | null> {
    const tokenData = {
      key: email,
      type: this.TokenTypes.FORGOT_PASSWORD,
      expires: moment().add(this.tokenExpires, "minutes").toDate(),
      status: this.TokenStatus.NOTUSED,
    } as ITokenCreationBody;
    return this.createToken(tokenData);
  }

  async createToken(record: ITokenCreationBody): Promise<IToken | null> {
    const tokenData = { ...record };
    let validCode = false;
    while (!validCode) {
      tokenData.code = Utility.generateCode(6);
      const isCodeExist = await this.getTokenByField({ code: tokenData.code });
      if (!isCodeExist) {
        validCode = true;
      }
    }
    try {
      return await this.tokenDataSource.create(tokenData);
    } catch (error) {
      console.error("Error creating token:", error);
      throw error;
    }
  }

  async updateRecord(
    searchBy: Partial<IToken>,
    record: Partial<IToken>,
  ): Promise<void> {
    const query = { where: { ...searchBy }, raw: true } as IFindTokenQuery;
    try {
      await this.tokenDataSource.updateOne(record, query);
    } catch (error) {
      console.error("Error updating token record:", error);
      throw error;
    }
  }
}

export default TokenService;
