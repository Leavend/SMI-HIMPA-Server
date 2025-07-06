/**
 * Return Controller
 * Handles return CRUD operations
 */
import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import ReturnService from "../service/return-service";
import UserService from "../service/user-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";

@autoInjectable()
class ReturnController {
  constructor(
    private returnService: ReturnService,
    private userService: UserService,
  ) {}

  /**
   * Get all return records
   */
  async findAllReturns(_req: Request, res: Response): Promise<Response> {
    try {
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
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Get return records by user
   */
  async findReturnsByUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id: userId } = req.params;
      const user = await this.userService.getUserByField({ userId });
      if (!user) {
        return Utility.handleError(
          res,
          "User not found",
          ResponseCode.NOT_FOUND,
        );
      }
      const returnRecords = await this.returnService.getReturnsByUser(userId);
      if (!returnRecords || returnRecords.length === 0) {
        return Utility.handleError(
          res,
          "No return records found for this user",
          ResponseCode.NOT_FOUND,
        );
      }
      const formattedReturns = returnRecords.map((r) => {
        let lateDays = 0;
        const borrowDetailForLogic = r.borrow?.borrowDetails?.[0];
        if (
          borrowDetailForLogic &&
          borrowDetailForLogic.status !== "RETURNED"
        ) {
          const now = new Date();
          const expectedReturnDate = new Date(r.dateReturn);
          if (now > expectedReturnDate) {
            const diffTime = now.getTime() - expectedReturnDate.getTime();
            lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        } else if (
          !borrowDetailForLogic ||
          borrowDetailForLogic.status === undefined
        ) {
          const now = new Date();
          const expectedReturnDate = new Date(r.dateReturn);
          if (now > expectedReturnDate) {
            const diffTime = now.getTime() - expectedReturnDate.getTime();
            lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        return {
          returnId: r.returnId,
          borrowId: r.borrowId,
          quantity: r.quantity,
          dateBorrow: r.dateBorrow,
          dateReturn: r.dateReturn,
          lateDays,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          borrow: {
            borrowDetails: r.borrow?.borrowDetails?.map((detail) => ({
              inventory: detail.inventory
                ? { name: detail.inventory.name }
                : undefined,
              status: detail.status !== undefined ? detail.status : "UNKNOWN",
            })),
          },
        };
      });
      return Utility.handleSuccess(
        res,
        "Return records fetched successfully",
        { returns: formattedReturns },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Update a return record
   */
  async updateReturn(req: Request, res: Response): Promise<Response> {
    try {
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
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a return record
   */
  async deleteReturn(req: Request, res: Response): Promise<Response> {
    try {
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
    } catch (error) {
      return Utility.handleError(
        res,
        error instanceof Error ? error.message : "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }
}

export default ReturnController;
