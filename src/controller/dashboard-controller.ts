import { Request, Response } from "express";
import { autoInjectable } from "tsyringe";

import BorrowService from "../service/borrow-service";
import BorrowDetailService from "../service/borrowDetail-service";
import InventoryService from "../service/inventory-service";

import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";

// Popular Items to Borrow,
// Borrowed Summary,
// Dues & Pending Request Borrow,

@autoInjectable()
class DashboardController {
  constructor(
    private borrowService: BorrowService,
    private borrowDetailService: BorrowDetailService,
    private inventoryService: InventoryService,
  ) {}

  async getDashboardMetrics(req: Request, res: Response) {
    try {
      // Get the popular items to borrow
      const borrowDetails =
        await this.borrowDetailService.getAllBorrowDetails();

      if (!borrowDetails || borrowDetails.length === 0) {
        return Utility.handleSuccess(
          res,
          "No borrowed records found",
          { itemDetails: [], borrowedSummary: {}, pendingRequests: [] },
          ResponseCode.SUCCESS,
        );
      }

      // Combine borrow details with inventory details
      const itemDetails = await Promise.all(
        borrowDetails.map(async (borrowDetail) => {
          const { inventoryId } = borrowDetail;
          const itemDetail = await this.inventoryService.getInventoryByField({
            inventoryId,
          });
          return {
            ...borrowDetail,
            itemDetail,
          };
        }),
      );

      // Get Borrowed Summary
      const borrowedSummary = itemDetails.reduce(
        (acc, item) => {
          const { status } = item;
          if (status === "ACTIVE") {
            acc.borrowed += 1;
          } else if (status === "RETURNED") {
            acc.returned += 1;
          } else if (status === "PENDING") {
            acc.pending += 1;
          }
          return acc;
        },
        { borrowed: 0, returned: 0, pending: 0 },
      );

      // Get Pending Requests (grouped by user)
      const pendingRequests = await Promise.all(
        itemDetails
          .filter((item) => item.status === "PENDING")
          .map(async (item) => {
            const borrow = await this.borrowService.getBorrowByField({
              borrowId: item.borrowId,
            });
            return {
              userId: borrow?.userId,
              inventoryId: item.inventoryId,
              itemName: item.itemDetail?.name || "Unknown Item",
              requestDate: borrow?.dateBorrow || "Unknown Date",
            };
          }),
      ).then((requests) =>
        requests.reduce((acc: { [key: string]: any[] }, item) => {
          const { userId } = item;
          if (!userId) return acc;
          if (!acc[userId]) {
            acc[userId] = [];
          }
          acc[userId].push({
            inventoryId: item.inventoryId,
            itemName: item.itemName,
            requestDate: item.requestDate,
          });
          return acc;
        }, {}),
      );

      // Return the fetched data
      return Utility.handleSuccess(
        res,
        "Items Borrowed records fetched successfully",
        { itemDetails, borrowedSummary, pendingRequests },
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

export default DashboardController;
