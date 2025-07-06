import express, { Request, Response, NextFunction } from "express";
import BorrowController from "../controller/borrow-controller";
import { Auth, validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/borrow-validator-schema";
import { container } from "tsyringe";

const router = express.Router();
const borrowController = container.resolve(BorrowController);

/**
 * Async error handler wrapper for route handlers
 * @param fn - Route handler function
 * @returns Wrapped route handler with error handling
 */
const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Route error:", error);
      res.status(500).json({
        status: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    });
  };

// Create borrow route
router.post(
  "/",
  Auth(),
  validator(ValidationSchema.createBorrowSchema),
  asyncHandler(borrowController.createBorrow.bind(borrowController)),
);

// Get borrows by user ID
router.get(
  "/borrows/:id",
  Auth(),
  asyncHandler(borrowController.getBorrowsByUser.bind(borrowController)),
);

// Get all borrows
router.get(
  "/",
  Auth(),
  asyncHandler(borrowController.findAllBorrows.bind(borrowController)),
);

// Update borrow
router.put(
  "/:id",
  Auth(),
  asyncHandler(borrowController.updateBorrow.bind(borrowController)),
);

// Delete borrow
router.delete(
  "/:id",
  Auth(),
  asyncHandler(borrowController.deleteBorrow.bind(borrowController)),
);

// Approve or decline borrow
router.patch(
  "/approve",
  Auth(),
  asyncHandler(borrowController.approveOrDeclineBorrow.bind(borrowController)),
);

export default router;
