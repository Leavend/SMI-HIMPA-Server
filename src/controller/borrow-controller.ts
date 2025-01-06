import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { IBorrowCreationBody } from "../interface/borrow-interface";
import BorrowService from "../service/borrow-service";
import BorrowDetailService from "../service/borrowDetail-service";
import UserService from "../service/user-service";
import WhatsAppService from "../service/whatsapp-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import { BorrowStatus } from "../interface/enum/borrow-enum";
import InventoryService from "../service/inventory-service";
import ReturnService from "../service/return-service";

@autoInjectable()
class BorrowController {
  constructor(
    private borrowService: BorrowService,
    private userService: UserService,
    private inventoryService: InventoryService,
    private borrowDetailService: BorrowDetailService,
    private returnService: ReturnService,
  ) {}

  async createBorrow(req: Request, res: Response) {
    const transaction = await this.borrowService.startTransaction();
    try {
      const params = { ...req.body };

      const item = await this.inventoryService.getInventoryByField({
        inventoryId: params.inventoryId,
      });
      if (!item || item.quantity < params.quantity) {
        return Utility.handleError(
          res,
          "Item not found or insufficient quantity in inventory.",
          ResponseCode.BAD_REQUEST,
        );
      }

      const [user, admin] = await Promise.all([
        this.userService.getUserByField({ userId: params.userId }),
        this.userService.getUserByField({ userId: params.adminId }),
      ]);
      if (!user || !user.number || !admin || !admin.number) {
        throw new Error("User or admin details are missing.");
      }

      const newBorrow: IBorrowCreationBody = {
        quantity: params.quantity,
        dateBorrow: params.dateBorrow,
        dateReturn: params.dateReturn,
        userId: params.userId,
        adminId: params.adminId,
      };

      const borrow = await this.borrowService.createBorrow(
        newBorrow,
        transaction,
      );

      const detailBorrow = await this.borrowDetailService.createBorrowDetail(
        {
          borrowId: borrow.borrowId,
          inventoryId: params.inventoryId,
          status: BorrowStatus.PENDING,
        },
        transaction,
      );

      await this.inventoryService.updateInventoryRecord(
        { inventoryId: item.inventoryId },
        { quantity: item.quantity - params.quantity },
        transaction,
      );

      await this.returnService.createReturn(
        {
          borrowId: borrow.borrowId,
          quantity: params.quantity,
          dateBorrow: params.dateBorrow,
          dateReturn: params.dateReturn,
        },
        transaction,
      );

      await transaction.commit();

      await this.sendWhatsAppNotifications(user, admin, item, params);

      return Utility.handleSuccess(
        res,
        "Borrow record and details created successfully",
        { borrowId: borrow.borrowId, detailBorrow },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      await transaction.rollback();
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  private async sendWhatsAppNotifications(
    user: any,
    admin: any,
    item: any,
    params: any,
  ) {
    try {
      await WhatsAppService.sendBorrowMessageToUser(
        user.username,
        user.number,
        item.name,
        params.dateBorrow,
        params.dateReturn,
      );
    } catch (whatsAppError) {
      console.error(
        "Failed to send WhatsApp notification to user:",
        whatsAppError,
      );
    }

    try {
      await WhatsAppService.sendBorrowMessageToAdmin(
        user.username,
        admin.username,
        admin.number,
        item.name,
        params.dateBorrow,
        params.dateReturn,
      );
    } catch (whatsAppError) {
      console.error(
        "Failed to send WhatsApp notification to admin:",
        whatsAppError,
      );
    }
  }

  // Fetch all borrow records
  async findAllBorrows(_req: Request, res: Response) {
    try {
      const borrows = await this.borrowService.getAllBorrows();
      if (!borrows || borrows.length === 0) {
        return Utility.handleError(
          res,
          "No borrow records found",
          ResponseCode.NOT_FOUND,
        );
      }
      return Utility.handleSuccess(
        res,
        "Borrow records fetched successfully",
        { borrows },
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

  // Fetch all borrow records by user ID
  async getBorrowsByUser(req: Request, res: Response) {
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

      return Utility.handleSuccess(
        res,
        "Borrow records fetched successfully",
        { borrowRecords },
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

  // Update a specific borrow record with borrow ID & update data quantity, dateReturn, status from req.body
  async updateBorrow(req: Request, res: Response) {
    try {
      const borrowId = req.params.id;

      const [borrow, borrowDetail] = await Promise.all([
        this.borrowService.getBorrowByField({ borrowId }),
        this.borrowDetailService.getBorrowDetailByField({ borrowId }),
      ]);

      if (!borrow || !borrowDetail) {
        return Utility.handleError(
          res,
          "No borrow records found.",
          ResponseCode.NOT_FOUND,
        );
      }

      const borrowDetailExists =
        await this.borrowDetailService.getBorrowDetailByField({ borrowId });
      if (!borrowDetailExists) {
        return Utility.handleError(
          res,
          "Borrow detail record not found",
          ResponseCode.NOT_FOUND,
        );
      }

      const updatedBorrow = await this.borrowService.updateBorrowRecord(
        { borrowId },
        req.body,
      );

      const updatedBorrowDetail =
        await this.borrowDetailService.updateBorrowDetailRecord(
          { borrowId },
          req.body,
        );

      return Utility.handleSuccess(
        res,
        "Borrow record updated successfully",
        { updatedBorrow, updatedBorrowDetail },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as Error).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Delete a specific borrow record
  async deleteBorrow(req: Request, res: Response) {
    try {
      const { id: borrowId } = req.params;
      if (!borrowId) {
        return Utility.handleError(
          res,
          "Borrow ID is required",
          ResponseCode.BAD_REQUEST,
        );
      }

      const sanitizedBorrowId = Utility.escapeHtml(borrowId);
      const borrowExists = await this.borrowService.getBorrowByField({
        borrowId: sanitizedBorrowId,
      });
      if (!borrowExists) {
        return Utility.handleError(
          res,
          "Borrow record not found",
          ResponseCode.NOT_FOUND,
        );
      }

      await this.borrowService.deleteBorrow({ borrowId: sanitizedBorrowId });
      return Utility.handleSuccess(
        res,
        "Borrow record deleted successfully",
        {},
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as Error).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Approve or Decline Borrow By Admin
  async approveOrDeclineBorrow(req: Request, res: Response) {
    try {
      const { borrowId, status } = req.body;

      const [borrow, borrowDetail] = await Promise.all([
        this.borrowService.getBorrowByField({ borrowId }),
        this.borrowDetailService.getBorrowDetailByField({ borrowId }),
      ]);

      if (!borrow || !borrowDetail) {
        return Utility.handleError(
          res,
          "No borrow records found.",
          ResponseCode.NOT_FOUND,
        );
      }

      if (borrowDetail.status !== BorrowStatus.PENDING) {
        return Utility.handleError(
          res,
          `Borrow cannot be updated. Current status is ${borrowDetail.status}.`,
          ResponseCode.BAD_REQUEST,
        );
      }

      if (![BorrowStatus.ACTIVE, BorrowStatus.REJECTED].includes(status)) {
        return Utility.handleError(
          res,
          "Invalid status update. Only 'Active' or 'Rejected' are allowed.",
          ResponseCode.BAD_REQUEST,
        );
      }

      await this.borrowDetailService.updateBorrowDetailRecord(
        { borrowId },
        { status },
      );

      await this.sendApprovalNotification(borrow, borrowDetail, status);

      return Utility.handleSuccess(
        res,
        `Borrow status successfully updated to ${status}.`,
        { borrowId, status },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Error updating borrow status:", error);
      return Utility.handleError(
        res,
        (error as Error).message,
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  private async sendApprovalNotification(
    borrow: any,
    borrowDetail: any,
    status: any,
  ) {
    try {
      const user = await this.userService.getUserByField({
        userId: borrow.userId,
      });
      const item = await this.inventoryService.getInventoryByField({
        inventoryId: borrowDetail.inventoryId,
      });

      if (!user || !item) {
        console.warn(
          "User or item details not found. Skipping WhatsApp notification.",
        );
        return;
      }

      const notificationData = {
        username: user.username,
        number: user.number,
        itemName: item.name,
        dateBorrow: borrow.dateBorrow,
        dateReturn: borrow.dateReturn,
        status,
      };

      await WhatsAppService.sendConfirmationBorrowMessageToUser(
        notificationData.username,
        notificationData.number,
        notificationData.itemName,
        notificationData.dateBorrow.toISOString(),
        notificationData.dateReturn
          ? notificationData.dateReturn.toISOString()
          : "",
        notificationData.status,
      );

      console.log(
        "WhatsApp notification sent successfully to user:",
        notificationData.number,
      );
    } catch (whatsAppError) {
      console.error(
        "Failed to send WhatsApp notification to user:",
        whatsAppError,
      );
    }
  }
}

export default BorrowController;
