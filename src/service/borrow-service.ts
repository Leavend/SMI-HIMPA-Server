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

@autoInjectable()
class BorrowService {
  constructor(
    @inject(BorrowDataSource) private borrowDataSource: BorrowDataSource,
    @inject("BorrowModel") private borrowModel: IBorrowModel,
    @inject("BorrowDetailModel") private borrowDetailModel: typeof BorrowDetailModel,
    @inject("InventoryModel") private inventoryModel: typeof InventoryModel,
    @inject("UserModel") private userModel: typeof UserModel,
  ) {}

  // Start a transaction
  async startTransaction(): Promise<Transaction> {
    return this.borrowDataSource.transaction();
  }

  // Get a single borrow record by specific fields
  async getBorrowByField(record: Partial<IBorrow>): Promise<IBorrow | null> {
    const mappedRecord = {
      ...(record.borrowId ? { borrow_id: record.borrowId } : {}),
      // tambahkan mapping lain kalau perlu
    };

    const query: IFindBorrowQuery = {
      where: mappedRecord,
      raw: true,
      returning: false,
    };
    return this.borrowDataSource.fetchOne(query);
  }

  // Get borrow records
  async getBorrowsByFields(
    record: Partial<IBorrow>,
    withDetails: boolean = false,
  ): Promise<IBorrowWithDetails[]> {
    const baseQuery: IFindBorrowQuery = {
      where: { ...record },
      raw: true,
      returning: false,
    };

    if (withDetails) {
      baseQuery.include = [
        {
          model: this.borrowDetailModel,
          as: "borrowDetails",
          include: [{
            model: this.inventoryModel,
            as: "inventory",
            attributes: ["name"],
          }],
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
    return (result || []) as IBorrowWithDetails[];
  }

  // Get all borrow records
  async getAllBorrows(): Promise<IBorrowWithDetails[] | null> {
    const query: IFindBorrowQuery = {
      include: [
        {
          model: BorrowDetailModel, // Use injected model
          as: "borrowDetails",
          include: [
            {
              model: InventoryModel, // Use injected model
              as: "inventory",
              attributes: ["name"],
            },
          ],
        },
        {
          model: UserModel, // Use injected model
          as: "user",
          attributes: ["username"], // Fixed case to match your model
        },
      ],
      order: [["dateBorrow", "DESC"]],
      where: {},
      returning: false,
    };

    return this.borrowDataSource.fetchAll(query) as Promise<
      IBorrowWithDetails[]
    >;
  }

  // Create a new borrow record
  async createBorrow(
    record: IBorrowCreationBody,
    transaction?: any,
  ): Promise<IBorrow> {
    return this.borrowDataSource.create(record);
  }

  // Update a single borrow record
  async updateBorrowRecord(
    searchBy: Partial<IBorrow>,
    record: Partial<IBorrow>,
  ): Promise<void> {
    try {
      const query = { where: { ...searchBy } } as IFindBorrowQuery;
      await this.borrowDataSource.updateOne(query, record);
    } catch (error) {
      console.error("Error updating borrow record:", error);
      throw error;
    }
  }

  // Delete a single borrow record
  async deleteBorrow(record: Partial<IBorrow>): Promise<void> {
    const query = { where: { ...record } } as IFindBorrowQuery;
    await this.borrowDataSource.deleteOne(query);
  }
}

export default BorrowService;
