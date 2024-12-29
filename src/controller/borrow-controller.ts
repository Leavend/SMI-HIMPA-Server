import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { IBorrowCreationBody } from "../interface/borrow-interface";
import BorrowService from "../service/borrow-service";
import BorrowDetailService from "../service/borrowDetail-service";
import UserService from "../service/user-service";
import WhatsAppService from "../service/whatsapp-service";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import Permissions from "../permission";
import { BorrowStatus } from "../interface/enum/borrow-enum";
import InventoryService from "../service/inventory-service";

@autoInjectable()
class BorrowController {
  private borrowService: BorrowService;
  private userService: UserService;
  private inventoryService: InventoryService;
  private borrowDetailService: BorrowDetailService;

  constructor(
    _borrowService: BorrowService,
    _userService: UserService,
    _inventoryService: InventoryService,
    _borrowDetailService: BorrowDetailService,
  ) {
    this.borrowService = _borrowService;
    this.userService = _userService;
    this.inventoryService = _inventoryService;
    this.borrowDetailService = _borrowDetailService;
  }

  // Create a new borrow record
  async createBorrow(req: Request, res: Response) {
    const transaction = await this.borrowService.startTransaction();
    try {
      const params = { ...req.body };

      // Validasi kuantitas inventory
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

      // Validasi pengguna dan admin
      const [user, admin] = await Promise.all([
        this.userService.getUserByField({ userId: params.userId }),
        this.userService.getUserByField({ userId: params.adminId }),
      ]);
      if (!user || !user.number || !admin || !admin.number) {
        throw new Error("User or admin details are missing.");
      }

      // Buat objek untuk borrow baru
      const newBorrow = {
        quantity: params.quantity,
        dateBorrow: params.dateBorrow,
        dateReturn: params.dateReturn,
        userId: params.userId,
        adminId: params.adminId,
      } as IBorrowCreationBody;

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

      // Perbarui jumlah inventory
      await this.inventoryService.updateInventoryRecord(
        { inventoryId: item.inventoryId },
        { quantity: item.quantity - params.quantity },
        transaction,
      );

      // Commit transaksi
      await transaction.commit();

      // Kirim notifikasi WhatsApp (di luar transaksi)
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

      // Kembalikan respons sukses
      return Utility.handleSuccess(
        res,
        "Borrow record and details created successfully",
        { borrowId: borrow.borrowId, detailBorrow },
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

  // Fetch all borrow records
  async findAllBorrows(req: Request, res: Response) {
    try {
      const admin = req.body.user;
      const permission = Permissions.can(admin.role).readAny("borrows");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }

      const borrows = await this.borrowService.getAllBorrows();
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

  // Fetch a specific borrow record by ID
  async getBorrowById(req: Request, res: Response) {
    try {
      const { id: borrowId } = req.params;
      if (!borrowId) {
        return Utility.handleError(
          res,
          "Borrow ID is required",
          ResponseCode.BAD_REQUEST,
        );
      }

      const borrow = await this.borrowService.getBorrowByField({
        borrowId: Utility.escapeHtml(borrowId),
      });
      if (!borrow) {
        return Utility.handleError(
          res,
          "Borrow record not found",
          ResponseCode.NOT_FOUND,
        );
      }
      return Utility.handleSuccess(
        res,
        "Borrow record fetched successfully",
        { borrow },
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

  // Fetch a specific borrow record by field
  async getBorrow(req: Request, res: Response) {
    try {
      const { id: borrowId } = req.params;
      if (!borrowId) {
        return Utility.handleError(
          res,
          "Borrow ID is required",
          ResponseCode.BAD_REQUEST,
        );
      }

      const borrow = await this.borrowService.getBorrowByField({
        borrowId: Utility.escapeHtml(borrowId),
      });
      if (!borrow) {
        return Utility.handleError(
          res,
          "Borrow record not found",
          ResponseCode.NOT_FOUND,
        );
      }
      return Utility.handleSuccess(
        res,
        "Borrow record fetched successfully",
        { borrow },
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

  // Update a specific borrow record
  async updateBorrow(req: Request, res: Response) {
    try {
      // Ambil dan validasi borrowId dari parameter URL
      const { id: borrowId } = req.params;
      if (!borrowId) {
        return Utility.handleError(
          res,
          "Borrow ID is required",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Escape HTML untuk borrowId
      const sanitizedBorrowId = Utility.escapeHtml(borrowId);

      // Cek apakah borrow record ada
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

      // Ambil data untuk diupdate dari request body
      const { quantity, dateReturn } = req.body;

      // Pastikan data yang diterima untuk pembaruan valid
      if (!quantity && !dateReturn) {
        return Utility.handleError(
          res,
          "No valid data provided for update",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Update borrow record
      const updateData: Partial<IBorrowCreationBody> = {};
      if (quantity) updateData.quantity = quantity;
      if (dateReturn) updateData.dateReturn = dateReturn;

      await this.borrowService.updateBorrowRecord(
        { borrowId: sanitizedBorrowId },
        updateData,
      );

      // Kembalikan respons sukses
      return Utility.handleSuccess(
        res,
        "Borrow record updated successfully",
        { borrowId: sanitizedBorrowId, updatedFields: updateData },
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
      const admin = req.body.user;

      // 1. Validate user permissions
      const permission = Permissions.can(admin.role).updateAny("borrows");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "You do not have permission to update borrow records.",
          ResponseCode.FORBIDDEN,
        );
      }

      // 2. Validate borrow record and borrow detail
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

      // 3. Validate current status
      if (borrowDetail.status !== BorrowStatus.PENDING) {
        return Utility.handleError(
          res,
          `Borrow cannot be updated. Current status is ${borrowDetail.status}.`,
          ResponseCode.BAD_REQUEST,
        );
      }

      // 4. Validate and update status
      if (![BorrowStatus.ACTIVE, BorrowStatus.REJECTED].includes(status)) {
        return Utility.handleError(
          res,
          "Invalid status update. Only 'Active' or 'Rejected' are allowed.",
          ResponseCode.BAD_REQUEST,
        );
      }

      if (status === BorrowStatus.ACTIVE) {
        // Update the borrow status to ACTIVE
        await this.borrowDetailService.updateBorrowDetailRecord(
          { borrowId },
          { status: BorrowStatus.ACTIVE },
        );

        // Additional logic for ACTIVE status can be added here
      } else if (status === BorrowStatus.REJECTED) {
        // Update the borrow status to REJECTED
        await this.borrowDetailService.updateBorrowDetailRecord(
          { borrowId },
          { status: BorrowStatus.REJECTED },
        );
      }

      // 5. Send WhatsApp notification
      try {
        // Extract user information from the borrow record
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
        } else {
          // Prepare notification details
          const notificationData = {
            username: user.username,
            number: user.number,
            itemName: item.name,
            dateBorrow: borrow.dateBorrow,
            dateReturn: borrow.dateReturn,
            status,
          };

          // Send WhatsApp notification
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
        }
      } catch (whatsAppError) {
        console.error(
          "Failed to send WhatsApp notification to user:",
          whatsAppError,
        );
      }

      // 6. Return success response
      return Utility.handleSuccess(
        res,
        "Borrow status successfully updated to Active.",
        { borrowId, status: BorrowStatus.ACTIVE },
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
}

export default BorrowController;
