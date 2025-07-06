import { autoInjectable, inject } from "tsyringe";
import { Transaction } from "sequelize";
import {
  IFindBorrowQuery,
  IBorrow,
  IBorrowCreationBody,
  IBorrowWithDetails,
  IBorrowModel,
} from "../interface/borrow-interface";
import BorrowDetailModel from "../model/borrowDetail-model";
import InventoryModel from "../model/inventory-model";
import UserModel from "../model/user-model";
import BorrowDataSource from "../datasource/borrow-datasource";
import BorrowDetailDataSource from "../datasource/borrowDetail-datasource";

@autoInjectable()
class BorrowService {
  constructor(
    @inject(BorrowDataSource) private borrowDataSource: BorrowDataSource,
    @inject(BorrowDetailDataSource) private borrowDetailDataSource: BorrowDetailDataSource,
    @inject("BorrowModel") private borrowModel: IBorrowModel,
    @inject("BorrowDetailModel")
    private borrowDetailModel: typeof BorrowDetailModel,
    @inject("InventoryModel") private inventoryModel: typeof InventoryModel,
    @inject("UserModel") private userModel: typeof UserModel,
  ) {}

  /**
   * Start a database transaction
   * @returns Database transaction object
   */
  async startTransaction(): Promise<Transaction> {
    return this.borrowDataSource.transaction();
  }

  /**
   * Get a single borrow record by specific fields
   * @param record - Partial borrow record to search by
   * @returns Borrow record or null if not found
   */
  async getBorrowByField(record: Partial<IBorrow>): Promise<IBorrow | null> {
    const mappedRecord = {
      ...(record.borrowId ? { borrow_id: record.borrowId } : {}),
    };

    const query: IFindBorrowQuery = {
      where: mappedRecord,
      raw: true,
      returning: false,
    };
    return this.borrowDataSource.fetchOne(query);
  }

  /**
   * Get borrow records with optional details
   * @param record - Partial borrow record to search by
   * @param withDetails - Whether to include related details
   * @returns Array of borrow records with details
   */
  async getBorrowsByFields(
    record: Partial<IBorrow>,
    withDetails = false,
  ): Promise<IBorrowWithDetails[]> {
    const baseQuery: IFindBorrowQuery = {
      where: { ...record },
      raw: false,
      returning: false,
    };

    if (withDetails) {
      baseQuery.include = [
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
          attributes: ["username"],
        },
      ];
      baseQuery.order = [["dateBorrow", "DESC"]];
    }

    const result = await this.borrowDataSource.fetchAll(baseQuery);
    return result as IBorrowWithDetails[];
  }

  /**
   * Get all borrow records with details
   * @returns Array of all borrow records with details
   */
  async getAllBorrows(): Promise<IBorrowWithDetails[]> {
    const query: IFindBorrowQuery = {
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
          attributes: ["username"],
        },
      ],
      order: [["dateBorrow", "DESC"]],
      where: {},
      returning: false,
    };

    const result = await this.borrowDataSource.fetchAll(query);
    return result as IBorrowWithDetails[];
  }

  /**
   * Create a new borrow record
   * @param record - Borrow record to create
   * @param transaction - Optional database transaction
   * @returns Created borrow record
   */
  async createBorrow(
    record: IBorrowCreationBody,
    transaction?: Transaction,
  ): Promise<IBorrow> {
    // Note: The datasource create method doesn't accept transaction parameter
    // Transaction handling should be done at a higher level if needed
    return this.borrowDataSource.create(record);
  }

  /**
   * Update a single borrow record
   * @param searchBy - Fields to search by
   * @param record - Fields to update
   * @throws Error if update fails
   */
  async updateBorrowRecord(
    searchBy: Partial<IBorrow>,
    record: Partial<IBorrow>,
  ): Promise<void> {
    try {
      const query: IFindBorrowQuery = {
        where: { ...searchBy },
        returning: false,
      };
      await this.borrowDataSource.updateOne(query, record);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error updating borrow record: ${errorMessage}`);
    }
  }

  /**
   * Delete a single borrow record
   * @param record - Fields to identify the record to delete
   * @param cascade - Whether to delete related borrow details (default: false)
   * @throws Error if deletion fails
   */
  async deleteBorrow(record: Partial<IBorrow>, cascade: boolean = false): Promise<void> {
    try {
      // Check if there are related borrow details
      const relatedBorrowDetails = await this.borrowDetailDataSource.fetchAll({
        where: { borrowId: record.borrowId },
        raw: true,
        returning: false,
      });

      if (relatedBorrowDetails && relatedBorrowDetails.length > 0) {
        if (!cascade) {
          throw new Error(
            `Cannot delete borrow because it has ${relatedBorrowDetails.length} related borrow detail(s). ` +
            `Use cascade=true to delete related records as well.`,
          );
        }

        // If cascade is true, delete related borrow details first
        for (const borrowDetail of relatedBorrowDetails) {
          await this.borrowDetailDataSource.deleteOne({
            where: { borrowDetailId: borrowDetail.borrowDetailId },
            returning: false,
          });
        }
      }

      const query: IFindBorrowQuery = {
        where: { ...record },
        returning: false,
      };
      await this.borrowDataSource.deleteOne(query);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error deleting borrow record: ${errorMessage}`);
    }
  }
}

export default BorrowService;
