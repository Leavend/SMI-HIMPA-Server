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
import { InventoryStatus } from "../interface/enum/inventory-enum";

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

      // 1. Validasi inventory
      const item = await this.inventoryService.getInventoryByField({
        inventoryId: params.inventoryId,
      });

      if (!item || item.quantity < params.quantity) {
        return Utility.handleError(
          res,
          "Item not found or insufficient quantity.",
          ResponseCode.BAD_REQUEST,
        );
      }

      if (item.condition !== InventoryStatus.AVAILABLE) {
        return Utility.handleError(
          res,
          "Item is not available for borrowing.",
          ResponseCode.BAD_REQUEST,
        );
      }

      // 2. Validasi user dan admin
      const [user, admin] = await Promise.all([
        this.userService.getUserByField({ userId: params.userId }),
        this.userService.getUserByField({ userId: params.adminId }),
      ]);

      if (!user?.number || !admin?.number) {
        throw new Error("User or admin contact is missing.");
      }

      // 3. Hitung quantity baru
      const newQuantity = item.quantity - params.quantity;
      const updateInventoryData = {
        quantity: newQuantity,
        // Auto-update condition jika quantity habis
        condition:
          newQuantity <= 0 ? InventoryStatus.OUT_OF_STOCK : item.condition,
      };

      // 4. Buat transaksi peminjaman
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

      // 5. Buat detail peminjaman
      const detailBorrow = await this.borrowDetailService.createBorrowDetail(
        {
          borrowId: borrow.borrowId,
          inventoryId: params.inventoryId,
          status: BorrowStatus.PENDING,
        },
        transaction,
      );

      // 6. Update inventory (termasuk condition jika perlu)
      await this.inventoryService.updateInventoryRecord(
        { inventoryId: item.inventoryId },
        updateInventoryData,
        transaction,
      );

      // 7. Buat record pengembalian
      await this.returnService.createReturn(
        {
          borrowId: borrow.borrowId,
          quantity: params.quantity,
          dateBorrow: params.dateBorrow,
          dateReturn: params.dateReturn,
        },
        transaction,
      );

      // 8. Commit transaksi
      await transaction.commit();

      // 9. Kirim notifikasi
      await this.sendWhatsAppNotifications(user, admin, item, params);

      return Utility.handleSuccess(
        res,
        "Borrow created successfully",
        { borrowId: borrow.borrowId, detailBorrow },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Borrow creation failed:", error);
      return Utility.handleError(
        res,
        (error as Error).message || "Failed to create borrow",
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
        user,
        user.number,
        item.name,
        params.dateBorrow,
        params.dateReturn,
      );
    } catch (err) {
      console.error("Failed to send WA to user:", err);
    }

    try {
      await WhatsAppService.sendBorrowMessageToAdmin(
        user,
        admin,
        admin.number,
        item.name,
        params.dateBorrow,
        params.dateReturn,
      );
    } catch (err) {
      console.error("Failed to send WA to admin:", err);
    }
  }

  async findAllBorrows(_req: Request, res: Response) {
    try {
      const borrows = await this.borrowService.getAllBorrows();
      if (!borrows?.length) {
        return Utility.handleError(
          res,
          "No borrow records found",
          ResponseCode.NOT_FOUND,
        );
      }
      return Utility.handleSuccess(
        res,
        "Success",
        { borrows },
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
      if (!borrowRecords?.length) {
        return Utility.handleError(
          res,
          "No borrow records for this user",
          ResponseCode.NOT_FOUND,
        );
      }

      return Utility.handleSuccess(
        res,
        "Success",
        { borrowRecords },
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

  async updateBorrow(req: Request, res: Response) {
    try {
      const borrowId = req.params.id;

      const [borrow, borrowDetail] = await Promise.all([
        this.borrowService.getBorrowByField({ borrowId }),
        this.borrowDetailService.getBorrowDetailsByField({ borrowId }),
      ]);

      if (!borrow || !borrowDetail) {
        return Utility.handleError(
          res,
          "Borrow record not found",
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
        "Borrow updated successfully",
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
        "Borrow deleted successfully",
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

  async approveOrDeclineBorrow(req: Request, res: Response) {
    try {
      const { borrowId, status } = req.body;

      // Validate required fields
      if (!borrowId || !status) {
        return Utility.handleError(
          res,
          "borrowId and status are required",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Normalize and validate status
      const normalizedStatus = status.toUpperCase();
      const allowedStatuses = ["ACTIVE", "REJECTED", "RETURNED"];

      if (!allowedStatuses.includes(normalizedStatus)) {
        return Utility.handleError(
          res,
          `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
          ResponseCode.BAD_REQUEST,
        );
      }

      // Check if borrow exists
      const [borrow, borrowDetails] = await Promise.all([
        this.borrowService.getBorrowByField({ borrowId }),
        this.borrowDetailService.getBorrowDetailsByField({ borrowId }),
      ]);

      if (!borrow || !borrowDetails?.length) {
        return Utility.handleError(
          res,
          "Borrow not found",
          ResponseCode.NOT_FOUND,
        );
      }

      // Prepare update data
      const updateData: any = { status: normalizedStatus };

      // Add return date if status is RETURNED
      if (normalizedStatus === "RETURNED") {
        updateData.dateReturn = new Date().toISOString();
      }

      // Update status - remove the truthiness check since method returns void
      await this.borrowDetailService.updateBorrowDetailRecord(
        { borrowId },
        updateData,
      );

      // Verify update by fetching the updated record
      const updatedRecord =
        await this.borrowDetailService.getBorrowDetailsByField({ borrowId });
      if (!updatedRecord || updatedRecord[0].status !== normalizedStatus) {
        throw new Error("Failed to verify status update");
      }

      // Send notification
      await this.sendApprovalNotification(
        borrow,
        borrowDetails,
        normalizedStatus,
      );

      return Utility.handleSuccess(
        res,
        `Borrow status updated to ${normalizedStatus}`,
        {
          borrowId,
          status: normalizedStatus,
          ...(normalizedStatus === "RETURNED" && {
            dateReturn: updateData.dateReturn,
          }),
        },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Error in approveOrDeclineBorrow:", error);
      return Utility.handleError(
        res,
        (error as Error).message || "Internal server error",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  private async sendApprovalNotification(
    borrow: any,
    borrowDetails: any[],
    status: string,
  ) {
    try {
      const user = await this.userService.getUserByField({
        userId: borrow.userId,
      });

      for (const detail of borrowDetails) {
        const item = await this.inventoryService.getInventoryByField({
          inventoryId: detail.inventoryId,
        });

        if (!user || !item) continue;

        await WhatsAppService.sendConfirmationBorrowMessageToUser(
          user.username,
          user.number,
          item.name,
          borrow.dateBorrow.toISOString(),
          borrow.dateReturn?.toISOString() ?? "",
          status,
        );
      }
    } catch (error) {
      console.error("WhatsApp approval notification failed:", error);
    }
  }
}

export default BorrowController;
