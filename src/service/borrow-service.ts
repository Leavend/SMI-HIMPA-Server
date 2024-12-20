import { autoInjectable, inject } from "tsyringe";
import { Transaction } from "sequelize";
import {
  IFindBorrowQuery,
  IBorrow,
  IBorrowCreationBody,
} from "../interface/borrow-interface";
import BorrowDataSource from "../datasource/borrow-datasource";

@autoInjectable()
class BorrowService {
  constructor(
    @inject(BorrowDataSource) private borrowDataSource: BorrowDataSource
  ) {}

  // Start a transaction
  async startTransaction(): Promise<Transaction> {
    return this.borrowDataSource.transaction();
  }

  // Get a single borrow record by specific fields
  async getBorrowByField(record: Partial<IBorrow>): Promise<IBorrow | null> {
    const query = { where: { ...record }, raw: true } as IFindBorrowQuery;
    return this.borrowDataSource.fetchOne(query);
  }

  // Get all borrow records
  async getAllBorrows(): Promise<IBorrow[] | null> {
    const query = {
      where: {},
      order: [["dateBorrow", "DESC"]],
      raw: true,
    } as IFindBorrowQuery;
    return this.borrowDataSource.fetchAll(query);
  }

  // Create a new borrow record
  async createBorrow(
    record: IBorrowCreationBody,
    transaction?: any
  ): Promise<IBorrow> {
    return this.borrowDataSource.create(record);
  }

  // Update a single borrow record
  async updateBorrowRecord(
    searchBy: Partial<IBorrow>,
    record: Partial<IBorrow>
  ): Promise<void> {
    const query = { where: { ...searchBy } } as IFindBorrowQuery;
    await this.borrowDataSource.updateOne(query, record);
  }

  // Delete a single borrow record
  async deleteBorrow(record: Partial<IBorrow>): Promise<void> {
    const query = { where: { ...record } } as IFindBorrowQuery;
    await this.borrowDataSource.deleteOne(query);
  }
}

export default BorrowService;