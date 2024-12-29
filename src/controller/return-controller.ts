import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import ReturnService from "../service/return-service";
import UserService from "../service/user-service";
import BorrowService from "../service/borrow-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import { IReturn } from "../interface/return-interface";

@autoInjectable()
class ReturnController {
  constructor(
    private returnService: ReturnService,
    private userService: UserService,
    private borrowService: BorrowService,
  ) {}

  async findAllReturns(req: Request, res: Response) {
    const returns = await this.returnService.getAllReturns();
    return Utility.handleSuccess(
      res,
      "Return records fetched successfully",
      { returns },
      ResponseCode.SUCCESS,
    );
  }

  async findReturnsByUser(req: Request, res: Response) {
    const { userId } = req.params;

    const user = await this.userService.getUserByField({ userId });
    if (!user) {
      return Utility.handleError(res, "User not found", ResponseCode.NOT_FOUND);
    }

    const borrowRecords = await this.borrowService.getBorrowsByFields({
      userId,
    });
    if (!borrowRecords || borrowRecords.length === 0) {
      return Utility.handleError(
        res,
        "No borrow records found for this user",
        ResponseCode.NOT_FOUND,
      );
    }

    const borrowIds = borrowRecords.map((borrow: any) => borrow.borrowId);
    const returnRecords: IReturn[] = await Promise.all(
      borrowIds.map(
        async (borrowId) =>
          await this.returnService.getReturnByField({ borrowId }),
      ),
    ).then((records) =>
      records.filter((record): record is IReturn => record !== null),
    );

    if (returnRecords.length === 0) {
      return Utility.handleError(
        res,
        "No return records found for this user",
        ResponseCode.NOT_FOUND,
      );
    }

    return Utility.handleSuccess(
      res,
      "Return records fetched successfully",
      { returnRecords },
      ResponseCode.SUCCESS,
    );
  }

  async updateReturn(req: Request, res: Response) {
    const { returnId, quantity, dateReturn, fineAmount, lateDays } = req.body;
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

    const updateData = { quantity, dateReturn, fineAmount, lateDays };
    await this.returnService.updateReturnRecord({ returnId }, updateData);
    return Utility.handleSuccess(
      res,
      "Return record updated successfully",
      {},
      ResponseCode.SUCCESS,
    );
  }

  async deleteReturn(req: Request, res: Response) {
    const { returnId } = req.params;
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
