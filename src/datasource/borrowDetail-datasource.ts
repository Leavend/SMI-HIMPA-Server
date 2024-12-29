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
    return BorrowDetailModel.create(record);
  }

  // Fetch satu record borrow detail berdasarkan kriteria pencarian
  async fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null> {
    return BorrowDetailModel.findOne(query);
  }

  // Fetch semua record borrow detail berdasarkan kriteria pencarian
  async fetchAll(
    query: IFindBorrowDetailQuery,
  ): Promise<IBorrowDetail[] | null> {
    return BorrowDetailModel.findAll(query);
  }

  // Update satu record borrow detail berdasarkan kriteria pencarian
  async updateOne(
    searchBy: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void> {
    return BorrowDetailModel.update(data, searchBy).then(() => {});
  }

  // Hapus satu record borrow detail berdasarkan kriteria pencarian
  async deleteOne(query: IFindBorrowDetailQuery): Promise<void> {
    return BorrowDetailModel.destroy(query).then(() => {});
  }
}

export default BorrowDetailDataSource;
