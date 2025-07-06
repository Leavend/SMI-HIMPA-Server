import { autoInjectable } from "tsyringe";
import {
  IFindBorrowQuery,
  IBorrow,
  IBorrowCreationBody,
  IBorrowDataSource,
} from "../interface/borrow-interface";
import BorrowModel from "../model/borrow-model";

@autoInjectable()
class BorrowDataSource implements IBorrowDataSource {
  // Create a new borrow record
  async create(record: IBorrowCreationBody): Promise<IBorrow> {
    return BorrowModel.create(record);
  }

  // Fetch a single borrow record based on search criteria
  async fetchOne(query: IFindBorrowQuery): Promise<IBorrow | null> {
    return BorrowModel.findOne(query);
  }

  // Fetch all borrow records based on search criteria
  async fetchAll(query: IFindBorrowQuery): Promise<IBorrow[] | null> {
    return BorrowModel.findAll(query);
  }

  // Update a single borrow record based on search criteria
  async updateOne(
    searchBy: IFindBorrowQuery,
    data: Partial<IBorrow>,
  ): Promise<void> {
    await BorrowModel.update(data, searchBy);
  }

  // Delete a single borrow record based on search criteria
  async deleteOne(query: IFindBorrowQuery): Promise<void> {
    await BorrowModel.destroy(query);
  }

  // Implement transaction
  async transaction(): Promise<any> {
    if (!BorrowModel.sequelize) {
      throw new Error("Sequelize instance is not available");
    }
    return BorrowModel.sequelize.transaction();
  }
}

export default BorrowDataSource;
