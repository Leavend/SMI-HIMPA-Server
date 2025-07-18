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

/**
 * Service class for handling return-related operations
 */
@autoInjectable()
class ReturnService {
  constructor(
    @inject(ReturnDataSource) private returnDataSource: ReturnDataSource,
    @inject("ReturnModel") private returnModel: typeof ReturnModel,
    @inject("BorrowModel") private borrowModel: typeof BorrowModel,
    @inject("BorrowDetailModel")
    private borrowDetailModel: typeof BorrowDetailModel,
    @inject("InventoryModel") private inventoryModel: typeof InventoryModel,
    @inject("UserModel") private userModel: typeof UserModel,
  ) {}

  /**
   * Get returns by user ID with related data
   * @param userId - User ID to filter returns
   * @returns Promise resolving to array of returns
   */
  async getReturnsByUser(userId: string): Promise<IReturn[]> {
    try {
      return await this.returnModel.findAll({
        include: [
          {
            model: this.borrowModel,
            as: "borrow",
            where: { userId },
            required: true,
            include: [
              {
                model: this.borrowDetailModel,
                as: "borrowDetails",
                include: [
                  {
                    model: this.inventoryModel,
                    as: "inventory",
                    attributes: ["name"],
                  },
                ],
              },
              {
                model: this.userModel,
                as: "user",
                attributes: ["Username"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      console.error("Error fetching returns by user:", error);
      throw error;
    }
  }

  /**
   * Get return by field criteria
   * @param record - Partial return object to search by
   * @returns Promise resolving to return or null
   */
  async getReturnByField(record: Partial<IReturn>): Promise<IReturn | null> {
    try {
      return await this.returnDataSource.fetchOne({
        where: this.sanitizeWhereClause(record),
        raw: true,
      });
    } catch (error) {
      console.error("Error fetching return by field:", error);
      throw error;
    }
  }

  /**
   * Get return records by fields
   * @param record - Partial return object to search by
   * @returns Promise resolving to array of returns
   */
  async getReturnByFields(record: Partial<IReturn>): Promise<IReturn[]> {
    try {
      const query: IFindReturnQuery = {
        where: this.sanitizeWhereClause(record),
        raw: true,
      };
      const result = await this.returnDataSource.fetchAll(query);
      return result || [];
    } catch (error) {
      console.error("Error fetching returns by fields:", error);
      throw error;
    }
  }

  /**
   * Get all return records ordered by return date
   * @returns Promise resolving to array of returns
   */
  async getAllReturns(): Promise<IReturn[]> {
    try {
      const query: IFindReturnQuery = {
        where: {},
        order: [["dateReturn", "DESC"]],
        raw: true,
      };
      const result = await this.returnDataSource.fetchAll(query);
      return result || [];
    } catch (error) {
      console.error("Error fetching all returns:", error);
      throw error;
    }
  }

  /**
   * Create new return record
   * @param record - Return creation data
   * @param transaction - Optional database transaction
   * @returns Promise resolving to created return
   */
  async createReturn(
    record: IReturnCreationBody,
    transaction?: any,
  ): Promise<IReturn> {
    try {
      return await this.returnDataSource.create(record);
    } catch (error) {
      console.error("Error creating return:", error);
      throw error;
    }
  }

  /**
   * Update return record by search criteria
   * @param searchBy - Criteria to find return to update
   * @param record - Data to update
   * @returns Promise that resolves when update is complete
   */
  async updateReturnRecord(
    searchBy: Partial<IReturn>,
    record: Partial<IReturn>,
  ): Promise<void> {
    try {
      const query: IFindReturnQuery = {
        where: this.sanitizeWhereClause(searchBy),
      };
      await this.returnDataSource.updateOne(query, record);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat memperbarui catatan pengembalian: ${errorMessage}`);
    }
  }

  /**
   * Delete return record by criteria
   * @param record - Criteria to find return to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteReturn(record: Partial<IReturn>): Promise<void> {
    try {
      const query: IFindReturnQuery = {
        where: this.sanitizeWhereClause(record),
      };
      await this.returnDataSource.deleteOne(query);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat menghapus catatan pengembalian: ${errorMessage}`);
    }
  }

  /**
   * Sanitize where clause by removing undefined values
   * @param record - Record to sanitize
   * @returns Sanitized record object
   */
  private sanitizeWhereClause(record: Partial<IReturn>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== undefined),
    );
  }
}

export default ReturnService;
