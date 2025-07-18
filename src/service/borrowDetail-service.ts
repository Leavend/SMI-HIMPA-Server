import { autoInjectable } from "tsyringe";
import {
  IFindBorrowDetailQuery,
  IBorrowDetail,
  IBorrowDetailCreationBody,
} from "../interface/borrowDetail-interface";
import BorrowDetailDataSource from "../datasource/borrowDetail-datasource";

@autoInjectable()
class BorrowDetailService {
  constructor(private borrowDetailDataSource: BorrowDetailDataSource) {}

  // Mendapatkan satu record BorrowDetail berdasarkan field tertentu
  async getBorrowDetailsByField(record: Partial<IBorrowDetail>) {
    const { borrowId, inventoryId, status, ...rest } = record;

    const mappedRecord: Record<string, any> = {
      ...rest,
      ...(borrowId ? { borrow_id: borrowId } : {}),
      ...(inventoryId ? { inventory_id: inventoryId } : {}),
      ...(status ? { status: status.toLowerCase() } : {}),
    };

    const query: IFindBorrowDetailQuery = {
      where: mappedRecord,
      raw: true,
      returning: true,
    };

    return await this.borrowDetailDataSource.fetchAll(query);
  }

  // Mendapatkan semua record BorrowDetail
  async getAllBorrowDetails(): Promise<IBorrowDetail[] | null> {
    try {
      const query = {
        where: {},
        order: [["createdAt", "DESC"]],
        raw: true,
      } as IFindBorrowDetailQuery;
      return await this.borrowDetailDataSource.fetchAll(query);
    } catch (error) {
      console.error("Error fetching all borrow details:", error);
      throw error;
    }
  }

  // Membuat record BorrowDetail baru
  async createBorrowDetail(
    record: IBorrowDetailCreationBody,
    transaction?: any,
  ): Promise<IBorrowDetail> {
    try {
      return await this.borrowDetailDataSource.create(record);
    } catch (error) {
      console.error("Error creating borrow detail:", error);
      throw error;
    }
  }

  // Memperbarui satu record BorrowDetail
  async updateBorrowDetailRecord(
    searchBy: Partial<IBorrowDetail>,
    record: Partial<IBorrowDetail>,
  ): Promise<void> {
    try {
      const query = { where: { ...searchBy } } as IFindBorrowDetailQuery;
      await this.borrowDetailDataSource.updateOne(query, record);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat memperbarui detail peminjaman: ${errorMessage}`);
    }
  }

  // Menghapus satu record BorrowDetail
  async deleteBorrowDetail(record: Partial<IBorrowDetail>): Promise<void> {
    try {
      const query = { where: { ...record } } as IFindBorrowDetailQuery;
      await this.borrowDetailDataSource.deleteOne(query);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat menghapus detail peminjaman: ${errorMessage}`);
    }
  }
}

export default BorrowDetailService;
