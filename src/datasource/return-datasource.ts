import {
  IFindReturnQuery,
  IReturn,
  IReturnCreationBody,
  IReturnDataSource,
} from "../interface/return-interface";
import ReturnModel from "../model/return-model";

class ReturnDataSource implements IReturnDataSource {
  // Buat return record baru
  async create(record: IReturnCreationBody): Promise<IReturn> {
    return await ReturnModel.create(record);
  }

  // Fetch satu record return berdasarkan kriteria pencarian
  async fetchOne(query: IFindReturnQuery): Promise<IReturn | null> {
    return await ReturnModel.findOne(query);
  }

  // Fetch semua record return berdasarkan kriteria pencarian
  async fetchAll(query: IFindReturnQuery): Promise<IReturn[] | null> {
    return await ReturnModel.findAll(query);
  }

  // Update satu record return berdasarkan kriteria pencarian
  async updateOne(
    searchBy: IFindReturnQuery,
    data: Partial<IReturn>,
  ): Promise<void> {
    await ReturnModel.update(data, searchBy);
  }

  // Hapus satu record return berdasarkan kriteria pencarian
  async deleteOne(query: IFindReturnQuery): Promise<void> {
    await ReturnModel.destroy(query);
  }
}

export default ReturnDataSource;
