import { autoInjectable, inject } from "tsyringe";
import {
  IFindReturnQuery,
  IReturn,
  IReturnCreationBody,
} from "../interface/return-interface";
import ReturnDataSource from "../datasource/return-datasource";
import BorrowDataSource from "../datasource/borrow-datasource";
import ReturnModel from "../model/return-model";
import BorrowModel from "../model/borrow-model";
import BorrowDetailModel from "../model/borrowDetail-model";
import InventoryModel from "../model/inventory-model";
import UserModel from "../model/user-model";

@autoInjectable()
class ReturnService {
  constructor(
    @inject(ReturnDataSource) private returnDataSource: ReturnDataSource,
    @inject('ReturnModel') private returnModel: typeof ReturnModel,
    @inject('BorrowModel') private borrowModel: typeof BorrowModel,
    @inject('BorrowDetailModel') private borrowDetailModel: typeof BorrowDetailModel,
    @inject('InventoryModel') private inventoryModel: typeof InventoryModel,
    @inject('UserModel') private userModel: typeof UserModel
  ) {}

  async getReturnsByUser(userId: string): Promise<IReturn[]> {
    return this.returnModel.findAll({
      include: [
        {
          model: this.borrowModel,
          as: 'borrow', // Alias untuk BorrowModel
          where: { userId },
          required: true,
          include: [
            {
              model: this.borrowDetailModel,
              as: 'borrowDetails', // Alias untuk BorrowDetailModel
              include: [
                {
                  model: this.inventoryModel,
                  as: 'inventory', // Alias untuk InventoryModel
                  attributes: ['name'],
                },
              ],
            },
            {
              model: this.userModel,
              as: 'user', // Alias untuk UserModel
              attributes: ['Username'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
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
