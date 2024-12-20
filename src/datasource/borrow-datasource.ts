import {
  IFindBorrowQuery,
  IBorrow,
  IBorrowCreationBody,
  IBorrowDataSource,
} from "../interface/borrow-interface";
import BorrowModel from "../model/borrow-model";

class BorrowDataSource implements IBorrowDataSource {

  // Buat borrow record baru
  async create(record: IBorrowCreationBody): Promise<IBorrow> {
    return await BorrowModel.create(record);
  }

  // Fetch satu record borrow berdasarkan kriteria pencarian
  async fetchOne(query: IFindBorrowQuery): Promise<IBorrow | null> {
    return await BorrowModel.findOne(query);
  }

  // Fetch semua record borrow berdasarkan kriteria pencarian
  async fetchAll(query: IFindBorrowQuery): Promise<IBorrow[] | null> {
    return await BorrowModel.findAll(query);
  }

  // Update satu record borrow berdasarkan kriteria pencarian
  async updateOne(
    searchBy: IFindBorrowQuery,
    data: Partial<IBorrow>,
  ): Promise<void> {
    await BorrowModel.update(data, searchBy);
  }

  // Hapus satu record borrow berdasarkan kriteria pencarian
  async deleteOne(query: IFindBorrowQuery): Promise<void> {
    await BorrowModel.destroy(query);
  }

  // Implementasi transaction
  async transaction(): Promise<any> {
    if (!BorrowModel.sequelize) {
      throw new Error("Sequelize instance is not available");
    }
    return await BorrowModel.sequelize.transaction();
  }
}

export default BorrowDataSource;
