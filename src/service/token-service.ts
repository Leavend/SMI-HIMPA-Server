import moment from "moment";
import { autoInjectable } from "tsyringe";

import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
} from "../interface/token-interface";
import Utility from "../utils/index.utils";
import TokenDataSource from "../datasource/token-datasource";

/**
 * Service class for handling token-related operations
 */
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

  /**
   * Get token by field criteria
   * @param record - Partial token object to search by
   * @returns Promise resolving to token or null
   */
  async getTokenByField(record: Partial<IToken>): Promise<IToken | null> {
    try {
      const query = { where: { ...record }, raw: true } as IFindTokenQuery;
      return await this.tokenDataSource.fetchOne(query);
    } catch (error) {
      console.error("Error fetching token by field:", error);
      throw error;
    }
  }

  /**
   * Create forgot password token for email
   * @param email - Email address for token
   * @returns Promise resolving to created token or null
   */
  async createForgotPasswordToken(email: string): Promise<IToken | null> {
    const tokenData = {
      key: email,
      type: this.TokenTypes.FORGOT_PASSWORD,
      expires: moment().add(this.tokenExpires, "minutes").toDate(),
      status: this.TokenStatus.NOTUSED,
    } as ITokenCreationBody;
    return this.createToken(tokenData);
  }

  /**
   * Create token with unique code
   * @param record - Token creation data
   * @returns Promise resolving to created token or null
   */
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

  /**
   * Update token record by search criteria
   * @param searchBy - Criteria to find token to update
   * @param record - Data to update
   * @returns Promise that resolves when update is complete
   */
  async updateRecord(
    searchBy: Partial<IToken>,
    record: Partial<IToken>,
  ): Promise<void> {
    try {
      const query = { where: { ...searchBy }, raw: true } as IFindTokenQuery;
      await this.tokenDataSource.updateOne(record, query);
    } catch (error) {
      console.error("Error updating token record:", error);
      throw error;
    }
  }
}

export default TokenService;
