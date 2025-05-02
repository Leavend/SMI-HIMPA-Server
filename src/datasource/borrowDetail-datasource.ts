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

  // Ambil satu borrow detail berdasarkan kriteria
  async fetchOne(query: IFindBorrowDetailQuery): Promise<IBorrowDetail | null> {
    return BorrowDetailModel.findOne(query);
  }

  // Ambil semua borrow detail berdasarkan kriteria
  async fetchAll(
    query: IFindBorrowDetailQuery,
  ): Promise<IBorrowDetail[] | null> {
    return BorrowDetailModel.findAll(query);
  }

  // Update satu record berdasarkan query
  async updateOne(
    query: IFindBorrowDetailQuery,
    data: Partial<IBorrowDetail>,
  ): Promise<void> {
    const { where } = query;
    await BorrowDetailModel.update(data, { where });
  }

  // Hapus satu record berdasarkan query
  async deleteOne(query: IFindBorrowDetailQuery): Promise<void> {
    const { where } = query;
    await BorrowDetailModel.destroy({ where });
  }
}

export default BorrowDetailDataSource;
