import { autoInjectable, inject } from "tsyringe";
import {
  IFindReturnQuery,
  IReturn,
  IReturnCreationBody,
} from "../interface/return-interface";
import ReturnDataSource from "../datasource/return-datasource";
import BorrowDataSource from "../datasource/borrow-datasource";
import { IFindBorrowQuery } from "../interface/borrow-interface";

@autoInjectable()
class ReturnService {
  constructor(
    @inject(ReturnDataSource) private returnDataSource: ReturnDataSource,
    @inject(BorrowDataSource) private borrowDataSource: BorrowDataSource,
  ) {}

  async getReturnsByUser(userId: string, options?: any): Promise<IReturn[]> {
    const borrowQuery: IFindBorrowQuery = {
      where: { userId },
      raw: true,
      ...options,
    };

    const borrows = await this.borrowDataSource.fetchAll(borrowQuery);
    if (!borrows || borrows.length === 0) return [];

    const returnPromises = borrows.map(async (borrow: { borrowId: string }) => {
      const returnQuery: IFindReturnQuery = {
        where: { borrowId: borrow.borrowId },
        raw: true,
        ...options,
      };
      return this.returnDataSource.fetchOne(returnQuery);
    });

    const returnRecords = await Promise.all(returnPromises);
    return returnRecords.filter((record): record is IReturn => record !== null);
  }

  async getReturnByField(record: Partial<IReturn>): Promise<IReturn | null> {
    return this.returnDataSource.fetchOne({
      where: this.sanitizeWhereClause(record),
      raw: true,
    });
  }

  // Get return records by fields
  async getReturnByFields(record: Partial<IReturn>): Promise<IReturn[]> {
    const query: IFindReturnQuery = {
      where: this.sanitizeWhereClause(record),
      raw: true,
    };
    const result = await this.returnDataSource.fetchAll(query);
    return result || [];
  }

  // Get all return records
  async getAllReturns(): Promise<IReturn[]> {
    const query: IFindReturnQuery = {
      where: {},
      order: [["dateReturn", "DESC"]],
      raw: true,
    };
    const result = await this.returnDataSource.fetchAll(query);
    return result || [];
  }

  // Create new return record
  async createReturn(
    record: IReturnCreationBody,
    transaction?: any,
  ): Promise<IReturn> {
    return this.returnDataSource.create(record);
  }

  // Update return record
  async updateReturnRecord(
    searchBy: Partial<IReturn>,
    record: Partial<IReturn>,
  ): Promise<void> {
    const query: IFindReturnQuery = {
      where: this.sanitizeWhereClause(searchBy),
    };
    await this.returnDataSource.updateOne(query, record);
  }

  // Delete return record
  async deleteReturn(record: Partial<IReturn>): Promise<void> {
    const query: IFindReturnQuery = {
      where: this.sanitizeWhereClause(record),
    };
    await this.returnDataSource.deleteOne(query);
  }

  private sanitizeWhereClause(record: Partial<IReturn>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(record).filter(([_, value]) => value !== undefined),
    );
  }
}

export default ReturnService;
