import { autoInjectable } from "tsyringe";
import {
  IFindReturnQuery,
  IReturn,
  IReturnCreationBody,
} from "../interface/return-interface";
import ReturnDataSource from "../datasource/return-datasource";

@autoInjectable()
class ReturnService {
  private returnDataSource: ReturnDataSource;

  constructor(_returnDataSource: ReturnDataSource) {
    this.returnDataSource = _returnDataSource;
  }

  // Mendapatkan satu record return berdasarkan field tertentu
  async getReturnByField(record: Partial<IReturn>): Promise<IReturn | null> {
    const query = { where: { ...record }, raw: true } as IFindReturnQuery;
    return this.returnDataSource.fetchOne(query);
  }

  // Mendapatkan semua record return
  async getAllReturns(): Promise<IReturn[] | null> {
    const query = {
      where: {},
      order: [["dateReturn", "DESC"]],
      raw: true,
    } as IFindReturnQuery;
    return this.returnDataSource.fetchAll(query);
  }

  // Membuat record return baru
  async createReturn(record: IReturnCreationBody): Promise<IReturn> {
    return this.returnDataSource.create(record);
  }

  // Memperbarui satu record return
  async updateReturnRecord(
    searchBy: Partial<IReturn>,
    record: Partial<IReturn>,
  ): Promise<void> {
    const query = { where: { ...searchBy } } as IFindReturnQuery;
    await this.returnDataSource.updateOne(query, record);
  }

  // Menghapus satu record return
  async deleteReturn(record: Partial<IReturn>): Promise<void> {
    const query = { where: { ...record } } as IFindReturnQuery;
    await this.returnDataSource.deleteOne(query);
  }
}

export default ReturnService;
