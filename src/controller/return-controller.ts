import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { IReturnCreationBody } from "../interface/return-interface";
import ReturnService from "../service/return-service";
import UserService from "../service/user-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import Permissions from "../permission";

@autoInjectable()
class ReturnController {
  private returnService: ReturnService;
  private userService: UserService;

  constructor(_returnService: ReturnService, _userService: UserService) {
    this.returnService = _returnService;
    this.userService = _userService;
  }

  // Create a new return record
  async createReturn(req: Request, res: Response) {
    try {
      const { borrowId, quantity, dateReturn, lateDays, userId } = req.body;
      const newReturn: IReturnCreationBody = {
        borrowId,
        quantity,
        dateReturn: dateReturn || new Date(),
        lateDays: lateDays || 0,
      };

      // Validate user
      const user = await this.userService.getUserByField(userId);
      if (!user || !user.number) {
        return Utility.handleError(
          res,
          "User not found or phone number is missing.",
          ResponseCode.NOT_FOUND,
        );
      }

      // Create new return record
      const returnRecord = await this.returnService.createReturn(newReturn);

      return Utility.handleSuccess(
        res,
        "Return record created successfully",
        { returnRecord },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Fetch all return records
  async findAllReturns(req: Request, res: Response) {
    try {
      const admin = req.body.user;
      const permission = Permissions.can(admin.role).readAny("returns");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }

      const returns = await this.returnService.getAllReturns();
      return Utility.handleSuccess(
        res,
        "Return records fetched successfully",
        { returns },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Fetch a specific return record by ID
  async getReturnById(req: Request, res: Response) {
    try {
      const { returnId } = req.params;
      const returnRecord = await this.returnService.getReturnByField({
        returnId,
      });
      if (!returnRecord) {
        return Utility.handleError(
          res,
          "Return record not found",
          ResponseCode.NOT_FOUND,
        );
      }
      return Utility.handleSuccess(
        res,
        "Return record fetched successfully",
        { returnRecord },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Update a specific return record
  async updateReturn(req: Request, res: Response) {
    try {
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
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Delete a specific return record
  async deleteReturn(req: Request, res: Response) {
    try {
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
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }
}

export default ReturnController;
