import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { IBorrowCreationBody, IBorrow } from "../interface/borrow-interface";
import { IBorrowDetail } from "../interface/borrowDetail-interface";
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

// Types
interface CreateBorrowParams {
  inventoryId: string;
  quantity: number;
  dateBorrow: string;
  dateReturn: string;
  userId: string;
  adminId: string;
}

interface ApprovalParams {
  borrowId: string;
  status: string;
}

interface User {
  userId: string;
  username: string;
  number: string;
}

interface InventoryItem {
  inventoryId: string;
  name: string;
  quantity: number;
  condition: string;
}

@autoInjectable()
class BorrowController {
  constructor(
    private borrowService: BorrowService,
    private userService: UserService,
    private inventoryService: InventoryService,
    private borrowDetailService: BorrowDetailService,
    private returnService: ReturnService,
  ) {}

  /**
   * Create a new borrow record
   * @param req - Express request object
   * @param res - Express response object
   */
  async createBorrow(req: Request, res: Response): Promise<Response> {
    const transaction = await this.borrowService.startTransaction();

    try {
      const params: CreateBorrowParams = { ...req.body };

      // Validate borrow period (max 2 weeks, min 1 day)
      const dateBorrow = new Date(params.dateBorrow);
      const dateReturn = new Date(params.dateReturn);
      const diffDays = Math.ceil((dateReturn.getTime() - dateBorrow.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        return Utility.handleError(
          res,
          "Tanggal pengembalian harus setelah tanggal peminjaman.",
          ResponseCode.BAD_REQUEST,
        );
      }
      if (diffDays > 14) {
        return Utility.handleError(
          res,
          "Maksimal waktu peminjaman adalah 2 minggu (14 hari).",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Validate inventory
      const item = await this.inventoryService.getInventoryByField({
        inventoryId: params.inventoryId,
      });

      if (!item || item.quantity < params.quantity) {
        return Utility.handleError(
          res,
          "Item tidak ditemukan atau jumlah tidak mencukupi.",
          ResponseCode.BAD_REQUEST,
        );
      }

      if (item.condition !== InventoryStatus.AVAILABLE) {
        return Utility.handleError(
          res,
          "Item tidak tersedia untuk dipinjam.",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Validate user and admin
      const [user, admin] = await Promise.all([
        this.userService.getUserByField({ userId: params.userId }),
        this.userService.getUserByField({ userId: params.adminId }),
      ]);

      if (!user?.number || !admin?.number) {
        throw new Error("Kontak pengguna atau admin tidak ditemukan.");
      }

      // Calculate new quantity
      const newQuantity = item.quantity - params.quantity;
      const updateInventoryData = {
        quantity: newQuantity,
        condition:
          newQuantity <= 0 ? InventoryStatus.OUT_OF_STOCK : item.condition,
      };

      // Create borrow transaction
      const newBorrow: IBorrowCreationBody = {
        quantity: params.quantity,
        dateBorrow: new Date(params.dateBorrow),
        dateReturn: new Date(params.dateReturn),
        userId: params.userId,
        adminId: params.adminId,
      };

      const borrow = await this.borrowService.createBorrow(
        newBorrow,
        transaction,
      );

      // Create borrow detail
      const detailBorrow = await this.borrowDetailService.createBorrowDetail(
        {
          borrowId: borrow.borrowId,
          inventoryId: params.inventoryId,
          status: BorrowStatus.PENDING,
        },
        transaction,
      );

      // Update inventory
      await this.inventoryService.updateInventoryRecord(
        { inventoryId: item.inventoryId },
        updateInventoryData,
        transaction,
      );

      // Create return record
      await this.returnService.createReturn(
        {
          borrowId: borrow.borrowId,
          quantity: params.quantity,
          dateBorrow: new Date(params.dateBorrow),
          dateReturn: new Date(params.dateReturn),
        },
        transaction,
      );

      // Commit transaction
      await transaction.commit();

      // Send notifications
      await this.sendWhatsAppNotifications(user, admin, item, params);

      return Utility.handleSuccess(
        res,
        "Peminjaman berhasil dibuat",
        { borrowId: borrow.borrowId, detailBorrow },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      await transaction.rollback();
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat peminjaman";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Send WhatsApp notifications to user and admin
   * @param user - User information
   * @param admin - Admin information
   * @param item - Inventory item
   * @param params - Borrow parameters
   */
  private async sendWhatsAppNotifications(
    user: User,
    admin: User,
    item: InventoryItem,
    params: CreateBorrowParams,
  ): Promise<void> {
    try {
      await WhatsAppService.sendBorrowMessageToUser(
        user,
        user.number,
        item.name,
        params.dateBorrow,
        params.dateReturn,
      );
    } catch (error) {
      console.error("Gagal mengirim WA ke pengguna:", error);
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
    } catch (error) {
      console.error("Gagal mengirim WA ke admin:", error);
    }
  }

  /**
   * Get all borrow records
   * @param _req - Express request object (unused)
   * @param res - Express response object
   */
  async findAllBorrows(_req: Request, res: Response): Promise<Response> {
    try {
      const borrows = await this.borrowService.getAllBorrows();

      if (!borrows?.length) {
        return Utility.handleError(
          res,
          "Tidak ada catatan peminjaman ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      return Utility.handleSuccess(
        res,
        "Berhasil",
        { borrows },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Get borrow records by user ID
   * @param req - Express request object
   * @param res - Express response object
   */
  async getBorrowsByUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id: userId } = req.params;

      const user = await this.userService.getUserByField({ userId });
      if (!user) {
        return Utility.handleError(
          res,
          "Pengguna tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      const borrowRecords = await this.borrowService.getBorrowsByFields({
        userId,
      });

      if (!borrowRecords?.length) {
        return Utility.handleError(
          res,
          "Tidak ada catatan peminjaman untuk pengguna ini",
          ResponseCode.NOT_FOUND,
        );
      }

      return Utility.handleSuccess(
        res,
        "Berhasil",
        { borrowRecords },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Update a borrow record
   * @param req - Express request object
   * @param res - Express response object
   */
  async updateBorrow(req: Request, res: Response): Promise<Response> {
    try {
      const { id: borrowId } = req.params;

      const [borrow, borrowDetail] = await Promise.all([
        this.borrowService.getBorrowByField({ borrowId }),
        this.borrowDetailService.getBorrowDetailsByField({ borrowId }),
      ]);

      if (!borrow || !borrowDetail) {
        return Utility.handleError(
          res,
          "Catatan peminjaman tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      await this.borrowService.updateBorrowRecord({ borrowId }, req.body);
      await this.borrowDetailService.updateBorrowDetailRecord(
        { borrowId },
        req.body,
      );

      return Utility.handleSuccess(
        res,
        "Catatan peminjaman berhasil diperbarui",
        { borrowId },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Delete a borrow record
   * @param req - Express request object
   * @param res - Express response object
   */
  async deleteBorrow(req: Request, res: Response): Promise<Response> {
    try {
      const { id: borrowId } = req.params;

      if (!borrowId) {
        return Utility.handleError(
          res,
          "ID peminjaman diperlukan",
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
          "Catatan peminjaman tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      // Check if cascade parameter is provided
      const cascade = req.query.cascade === "true";

      await this.borrowService.deleteBorrow(
        { borrowId: sanitizedBorrowId },
        cascade,
      );

      const message = cascade
        ? "Catatan peminjaman dan detail peminjaman terkait berhasil dihapus"
        : "Catatan peminjaman berhasil dihapus";

      return Utility.handleSuccess(res, message, {}, ResponseCode.SUCCESS);
    } catch (error) {
      // Handle foreign key constraint error specifically
      if (
        error instanceof Error &&
        error.message.includes("Cannot delete borrow because it has")
      ) {
        return Utility.handleError(
          res,
          error.message,
          ResponseCode.BAD_REQUEST,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Approve or decline a borrow request
   * @param req - Express request object
   * @param res - Express response object
   */
  async approveOrDeclineBorrow(req: Request, res: Response): Promise<Response> {
    try {
      const { borrowId, status }: ApprovalParams = req.body;

      // Validate required fields
      if (!borrowId || !status) {
        return Utility.handleError(
          res,
          "borrowId dan status diperlukan",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Normalize and validate status
      const normalizedStatus = status.toUpperCase();
      const allowedStatuses = ["ACTIVE", "REJECTED", "RETURNED"];

      if (!allowedStatuses.includes(normalizedStatus)) {
        return Utility.handleError(
          res,
          `Status tidak valid. Nilai yang diizinkan: ${allowedStatuses.join(", ")}`,
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
          "Peminjaman tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      // Prepare update data
      const updateData: Record<string, unknown> = { status: normalizedStatus };

      // Add return date if status is RETURNED
      if (normalizedStatus === "RETURNED") {
        updateData.dateReturn = new Date().toISOString();
      }

      // Update status
      await this.borrowDetailService.updateBorrowDetailRecord(
        { borrowId },
        updateData,
      );

      // Verify update by fetching the updated record
      const updatedRecord =
        await this.borrowDetailService.getBorrowDetailsByField({ borrowId });
      if (!updatedRecord || updatedRecord[0].status !== normalizedStatus) {
        throw new Error("Gagal memverifikasi pembaruan status");
      }

      // Send notification
      await this.sendApprovalNotification(
        borrow,
        borrowDetails,
        normalizedStatus,
      );

      return Utility.handleSuccess(
        res,
        `Status peminjaman diperbarui menjadi ${normalizedStatus}`,
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
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan server internal";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }

  /**
   * Send approval notification to user
   * @param borrow - Borrow record
   * @param borrowDetails - Borrow details
   * @param status - Approval status
   */
  private async sendApprovalNotification(
    borrow: IBorrow,
    borrowDetails: IBorrowDetail[],
    status: string,
  ): Promise<void> {
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
          user,
          user.number,
          item.name,
          borrow.dateBorrow.toISOString(),
          borrow.dateReturn?.toISOString() ?? "",
          status,
        );
      }
    } catch (error) {
      console.error("Notifikasi persetujuan WhatsApp gagal:", error);
    }
  }
}

export default BorrowController;
