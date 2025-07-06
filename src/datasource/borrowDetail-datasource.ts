/**
 * Borrow Detail Data Source
 * Handles borrow detail data operations with the database
 */
import { autoInjectable } from "tsyringe";
import {
  IFindBorrowDetailQuery,
  IBorrowDetail,
  IBorrowDetailCreationBody,
  IBorrowDetailDataSource,
} from "../interface/borrowDetail-interface";
import BorrowDetailModel from "../model/borrowDetail-model";

@autoInjectable()
class BorrowDetailDataSource implements IBorrowDetailDataSource {
  /**
   * Create a new borrow detail record
   */
  async create(record: IBorrowDetailCreationBody): Promise<IBorrowDetail> {
    return BorrowDetailModel.create(record);
  }

  /**
   * Fetch a single borrow detail record based on search criteria
   */
  async fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null> {
    return BorrowDetailModel.findOne(query);
  }

  /**
   * Fetch all borrow detail records based on search criteria
   */
  async fetchAll(
    query: IFindBorrowDetailQuery,
  ): Promise<IBorrowDetail[] | null> {
    return BorrowDetailModel.findAll(query);
  }

  /**
   * Update a single borrow detail record based on search criteria
   */
  async updateOne(
    query: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void> {
    const { where } = query;
    await BorrowDetailModel.update(data, { where });
  }

  /**
   * Delete a single borrow detail record based on search criteria
   */
  async deleteOne(query: IFindBorrowDetailQuery): Promise<void> {
    const { where } = query;
    await BorrowDetailModel.destroy({ where });
  }
}

export default BorrowDetailDataSource;
