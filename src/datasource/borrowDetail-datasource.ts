import {
  IFindBorrowDetailQuery,
  IBorrowDetail,
  IBorrowDetailCreationBody,
  IBorrowDetailDataSource,
} from "../interface/borrowDetail-interface";
import BorrowDetailModel from "../model/borrowDetail-model";

class BorrowDetailDataSource implements IBorrowDetailDataSource {
  // Buat borrow detail record baru
  async create(record: IBorrowDetailCreationBody): Promise<IBorrowDetail> {
    return await BorrowDetailModel.create(record);
  }

  // Fetch satu record borrow detail berdasarkan kriteria pencarian
  async fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null> {
    return await BorrowDetailModel.findOne(query);
  }

  // Fetch semua record borrow detail berdasarkan kriteria pencarian
  async fetchAll(
    query: IFindBorrowDetailQuery,
  ): Promise<IBorrowDetail[] | null> {
    return await BorrowDetailModel.findAll(query);
  }

  // Update satu record borrow detail berdasarkan kriteria pencarian
  async updateOne(
    searchBy: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void> {
    await BorrowDetailModel.update(data, searchBy);
  }

  // Hapus satu record borrow detail berdasarkan kriteria pencarian
  async deleteOne(query: IFindBorrowDetailQuery): Promise<void> {
    await BorrowDetailModel.destroy(query);
  }
}

export default BorrowDetailDataSource;
