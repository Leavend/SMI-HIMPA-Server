import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import ReturnService from "../service/return-service";
import UserService from "../service/user-service";
import BorrowService from "../service/borrow-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";

@autoInjectable()
class ReturnController {
  constructor(
    private returnService: ReturnService,
    private userService: UserService,
    private borrowService: BorrowService,
  ) {}

  async findAllReturns(req: Request, res: Response) {
    const returns = await this.returnService.getAllReturns();
    if (!returns || returns.length === 0) {
      return Utility.handleError(
        res,
        "No returns records found",
        ResponseCode.NOT_FOUND,
      );
    }
    return Utility.handleSuccess(
      res,
      "Return records fetched successfully",
      { returns },
      ResponseCode.SUCCESS,
    );
  }

  async findReturnsByUser(req: Request, res: Response) {
    const { id: userId } = req.params;

    try {
      const user = await this.userService.getUserByField({ userId });
      if (!user) {
        return Utility.handleError(
          res,
          "User not found",
          ResponseCode.NOT_FOUND,
        );
      }

      // Get returns with details
      const borrowRecords = await this.borrowService.getBorrowsByFields(
        { userId },
        true, // with details
      );

      if (!borrowRecords || borrowRecords.length === 0) {
        return Utility.handleError(
          res,
          "No borrow records found for this user",
          ResponseCode.NOT_FOUND,
        );
      }

      // Filter only returned items
      const returnedRecords = borrowRecords.filter(
        (record) => record.dateReturn !== null,
      );

      if (returnedRecords.length === 0) {
        return Utility.handleError(
          res,
          "No return records found for this user",
          ResponseCode.NOT_FOUND,
        );
      }

      // Format response
      const formattedReturns = returnedRecords.map((record) => {
        // Perbaikan disini - akses inventory.name yang benar
        const inventoryName =
          record.borrowDetails?.[0]?.inventory?.name || "N/A";

        return {
          borrowId: record.borrowId,
          inventoryName, // Menggunakan variable yang sudah diperbaiki
          dateBorrow: record.dateBorrow,
          dateReturn: record.dateReturn,
          lateDays: this.calculateLateDays(
            record.dateBorrow,
            record.dateReturn,
          ),
          quantity: record.quantity,
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

  // Helper function to calculate late days
  private calculateLateDays(dateBorrow: Date, dateReturn: Date | null): number {
    if (!dateReturn) return 0;

    const expectedReturn = new Date(dateBorrow);
    expectedReturn.setDate(expectedReturn.getDate() + 7); // Contoh: 7 hari batas peminjaman

    const diffTime = dateReturn.getTime() - expectedReturn.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  async updateReturn(req: Request, res: Response) {
    const { id: returnId } = req.params;
    const { quantity, dateBorrow, dateReturn, lateDays } = req.body;
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

    const updateData = { quantity, dateBorrow, dateReturn, lateDays };
    await this.returnService.updateReturnRecord({ returnId }, updateData);
    return Utility.handleSuccess(
      res,
      "Return record updated successfully",
      {},
      ResponseCode.SUCCESS,
    );
  }

  async deleteReturn(req: Request, res: Response) {
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
