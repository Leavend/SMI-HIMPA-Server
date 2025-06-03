import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import ReturnService from "../service/return-service";
import UserService from "../service/user-service"; // Pastikan path ini benar
import Utility from "../utils/index.utils"; // Pastikan path ini benar
import { ResponseCode } from "../interface/enum/code-enum"; // Pastikan path ini benar

@autoInjectable()
class ReturnController {
  constructor(
    private returnService: ReturnService,
    private userService: UserService,
  ) {}

  async findAllReturns(req: Request, res: Response) {
    // ... (logika findAllReturns tetap sama)
    const returnRecords = await this.returnService.getAllReturns();
    if (!returnRecords || returnRecords.length === 0) {
      return Utility.handleError(
        res,
        "No returns records found",
        ResponseCode.NOT_FOUND,
      );
    }
    return Utility.handleSuccess(
      res,
      "Return records fetched successfully",
      { returns: returnRecords },
      ResponseCode.SUCCESS,
    );
  }

  async findReturnsByUser(req: Request, res: Response) {
    const { id: userId } = req.params;

    try {
      const userExists = await this.userService.getUserByField({ userId });
      if (!userExists) {
        return Utility.handleError(
          res,
          "User not found",
          ResponseCode.NOT_FOUND,
        );
      }

      let returnRecords = await this.returnService.getReturnsByUser(userId);

      if (!returnRecords || returnRecords.length === 0) {
        return Utility.handleError(
          res,
          "No return records found for this user",
          ResponseCode.NOT_FOUND,
        );
      }

      const updatePromises = returnRecords.map(async (record) => {
        const borrowObject = record.borrow as {
          dueDate?: Date | null; // Due date asli dari BorrowModel
          borrowDetails?: Array<{ inventory?: { name?: string }; status?: string }>;
          user?: { Username?: string; [key: string]: any };
        };

        const primaryBorrowStatus = borrowObject?.borrowDetails?.[0]?.status;
        let effectiveDueDate: Date;
        let actualPhysicalReturnDate: Date | null = null;

        if (primaryBorrowStatus && primaryBorrowStatus !== 'RETURNED') {
          // Jika status BUKAN 'RETURNED', maka r.dateReturn (dari ReturnModel) adalah dueDate
          // dan barang dianggap belum dikembalikan secara fisik.
          if (record.dateReturn) { // Ini adalah dueDate menurut aturan baru
            effectiveDueDate = new Date(record.dateReturn);
          } else if (borrowObject?.dueDate) { // Fallback ke dueDate dari BorrowModel jika ada
            effectiveDueDate = new Date(borrowObject.dueDate);
          } else { // Fallback terakhir ke dateBorrow + 7 hari
            effectiveDueDate = new Date(record.dateBorrow);
            effectiveDueDate.setDate(effectiveDueDate.getDate() + 7);
          }
          actualPhysicalReturnDate = null; // Dianggap belum dikembalikan
        } else {
          // Jika status ADALAH 'RETURNED' atau tidak diketahui, gunakan logika standar
          // Ambil dueDate dari BorrowModel jika ada, atau default 7 hari
          if (borrowObject?.dueDate) {
            effectiveDueDate = new Date(borrowObject.dueDate);
          } else {
            effectiveDueDate = new Date(record.dateBorrow);
            effectiveDueDate.setDate(effectiveDueDate.getDate() + 7);
          }
          // r.dateReturn adalah tanggal fisik pengembalian
          actualPhysicalReturnDate = record.dateReturn ? new Date(record.dateReturn) : null;
        }
        
        const currentLateDays = record.lateDays;
        const newCalculatedLateDays = this.calculateLateDays(effectiveDueDate, actualPhysicalReturnDate);

        if (currentLateDays !== newCalculatedLateDays) {
          try {
            await this.returnService.updateReturnRecord(
              { returnId: record.returnId },
              { lateDays: newCalculatedLateDays },
            );
            record.lateDays = newCalculatedLateDays;
          } catch (updateError) {
            console.error(`[ReturnController] Failed to update lateDays for returnId ${record.returnId}:`, updateError);
          }
        }
        return record;
      });

      returnRecords = await Promise.all(updatePromises);

      const formattedReturns = returnRecords.map((r) => {
        const borrowObject = r.borrow as {
          dueDate?: Date | null;
          borrowDetails?: Array<{ inventory?: { name?: string }; status?: string }>;
          user?: { Username?: string; [key: string]: any };
        };

        let mappedBorrowData: any;
        if (borrowObject) {
          mappedBorrowData = {
            borrowDetails: borrowObject.borrowDetails?.map((detail) => ({
              inventory: detail.inventory
                ? { name: detail.inventory.name }
                : undefined,
              status: detail.status,
            })),
          };
          const actualUsername = borrowObject?.user?.Username;
          if (actualUsername) {
            mappedBorrowData.user = { Username: actualUsername };
          }
        }

        return {
          returnId: r.returnId,
          borrowId: r.borrowId,
          quantity: r.quantity,
          dateBorrow: r.dateBorrow,
          dateReturn: r.dateReturn, // Ini tetap dateReturn dari ReturnModel
          lateDays: r.lateDays,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          borrow: mappedBorrowData,
        };
      });

      return Utility.handleSuccess(
        res,
        "Return records fetched successfully",
        { returns: formattedReturns },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Error in findReturnsByUser:", error);
      return Utility.handleError(
        res,
        (error as Error).message || "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Menghitung hari keterlambatan.
   * @param dueDate Tanggal seharusnya barang dikembalikan (jatuh tempo).
   * @param actualReturnDate Tanggal aktual barang dikembalikan. Null jika belum dikembalikan.
   * @returns Jumlah hari keterlambatan.
   */
  private calculateLateDays(dueDate: Date, actualReturnDate: Date | null): number {
    if (!dueDate) {
      // Seharusnya tidak terjadi jika logika di findReturnsByUser sudah benar menentukan dueDate
      console.warn("[calculateLateDays] Peringatan: dueDate tidak valid atau tidak ada.");
      return 0;
    }

    const normalizedDueDate = new Date(dueDate);
    normalizedDueDate.setHours(0, 0, 0, 0);

    if (actualReturnDate) {
      // --- BARANG SUDAH DIKEMBALIKAN SECARA FISIK ---
      const normalizedActualReturnDate = new Date(actualReturnDate);
      normalizedActualReturnDate.setHours(0, 0, 0, 0);

      if (normalizedActualReturnDate.getTime() <= normalizedDueDate.getTime()) {
        return 0; // Dikembalikan tepat waktu atau lebih awal
      }
      const diffTime = normalizedActualReturnDate.getTime() - normalizedDueDate.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      // --- BARANG BELUM DIKEMBALIKAN SECARA FISIK ---
      // Hitung keterlambatan dari dueDate hingga HARI INI
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (today.getTime() <= normalizedDueDate.getTime()) {
        // Jika dueDate adalah hari ini atau di masa depan, belum terlambat
        return 0;
      }
      const diffTime = today.getTime() - normalizedDueDate.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
  }

  async updateReturn(req: Request, res: Response) {
    // ... (logika updateReturn tetap sama, namun pastikan ia menggunakan calculateLateDays yang baru jika dateReturn diubah)
    // ... Untuk penyederhanaan, saya akan membiarkannya seperti sebelumnya,
    // ... tetapi idealnya, jika dateReturn diubah di sini, lateDays juga harus dihitung ulang dengan logika baru.
    const { id: returnId } = req.params;
    const { quantity, dateBorrow, dateReturn } = req.body;
    const returnExists = await this.returnService.getReturnByField({
      returnId,
    });

    if (!returnExists) {
      return Utility.handleError(
        res,
        "Return record not found",
        ResponseCode.NOT_FOUND,
      );
    }
    
    // Ambil borrow object terkait untuk mendapatkan status dan dueDate jika diperlukan
    // Ini mungkin memerlukan service method baru atau penyesuaian pada getReturnByField
    // Untuk contoh, kita asumsikan returnExists memiliki akses ke borrow.borrowDetails dan borrow.dueDate
    const borrowObject = (returnExists as any).borrow as {
        dueDate?: Date | null;
        borrowDetails?: Array<{ status?: string }>;
    };

    const primaryBorrowStatus = borrowObject?.borrowDetails?.[0]?.status;
    let effectiveDueDate: Date;
    let physicalReturnDateForCalc: Date | null = dateReturn ? new Date(dateReturn) : null;

    if (primaryBorrowStatus && primaryBorrowStatus !== 'RETURNED' && physicalReturnDateForCalc) {
        // Jika status BUKAN 'RETURNED', maka physicalReturnDateForCalc (yang berasal dari req.body.dateReturn)
        // harus dianggap sebagai dueDate BARU jika pengguna mengupdate tanggal jatuh tempo.
        // Jika barang belum dikembalikan (dateReturn dari body null), maka physicalReturnDateForCalc akan null.
        effectiveDueDate = physicalReturnDateForCalc; // dateReturn dari body menjadi dueDate
        if (primaryBorrowStatus !== 'RETURNED') { // Jika belum ada pengembalian fisik
            physicalReturnDateForCalc = null;
        }
    } else { // Status IS 'RETURNED' atau status tidak jelas, atau dateReturn dari body adalah null
        if (borrowObject?.dueDate) {
            effectiveDueDate = new Date(borrowObject.dueDate);
        } else {
            effectiveDueDate = new Date(dateBorrow || returnExists.dateBorrow);
            effectiveDueDate.setDate(effectiveDueDate.getDate() + 7);
        }
    }
    
    const calculatedLateDays = this.calculateLateDays(effectiveDueDate, physicalReturnDateForCalc);

    const updateData: any = { quantity, dateBorrow, dateReturn };
    if (typeof calculatedLateDays !== 'undefined') {
        updateData.lateDays = calculatedLateDays;
    }

    await this.returnService.updateReturnRecord({ returnId }, updateData);
    const updatedReturnRecord = await this.returnService.getReturnByField({ returnId }); // atau getReturnByFieldWithDetails

    return Utility.handleSuccess(
      res,
      "Return record updated successfully",
      { return: updatedReturnRecord },
      ResponseCode.SUCCESS,
    );
  }

  async deleteReturn(req: Request, res: Response) {
    // ... (logika deleteReturn tetap sama)
    const { id: returnId } = req.params;
    const returnExists = await this.returnService.getReturnByField({
      returnId,
    });
    if (!returnExists) {
      return Utility.handleError(
        res,
        "Return record not found",
        ResponseCode.NOT_FOUND,
      );
    }

    await this.returnService.deleteReturn({ returnId });
    return Utility.handleSuccess(
      res,
      "Return record deleted successfully",
      {},
      ResponseCode.SUCCESS,
    );
  }
}

export default ReturnController;
