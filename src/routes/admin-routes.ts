import express, { Request, Response } from "express";
import UserController from "../controller/user-controller";
import { AdminAuth, validator } from "../middlewares/index.middleware";
import InventoryValidationSchema from "../validators/inventory-validator-schema";
import BorrowValidationSchema from "../validators/borrow-validator-schema";
import { container } from "tsyringe";
import BorrowController from "../controller/borrow-controller";
import InventoryController from "../controller/inventory-controller";
import ReturnController from "../controller/return-controller";

const router = express.Router();
const userController = container.resolve(UserController);
const borrowController = container.resolve(BorrowController);
const inventoryController = container.resolve(InventoryController);
const returnController = container.resolve(ReturnController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createAdminRoute = () => {
  // User Routes
  router.put(
    "/user/update-role",
    AdminAuth(),
    asyncHandler(userController.updateRole.bind(userController)),
  );
  router.get(
    "/users",
    AdminAuth(),
    asyncHandler(userController.getAllUsersByAdmin.bind(userController)),
  );
  router.get(
    "/user/:id",
    AdminAuth(),
    asyncHandler(userController.getSingleUserById.bind(userController)),
  );
  router.get(
    "/admin/:id",
    AdminAuth(),
    asyncHandler(userController.getUserRoleAdmin.bind(userController)),
  );

  // Inventory Routes
  router.post(
    "/inventory",
    AdminAuth(),
    validator(InventoryValidationSchema.createInventorySchema),
    asyncHandler(inventoryController.addInventory.bind(inventoryController)),
  );
  router.put(
    "/inventory/:id",
    AdminAuth(),
    validator(InventoryValidationSchema.updateInventorySchema),
    asyncHandler(inventoryController.modifyInventory.bind(inventoryController)),
  );
  router.delete(
    "/inventory/:id",
    AdminAuth(),
    asyncHandler(inventoryController.removeInventory.bind(inventoryController)),
  );

  // Borrow Routes
  router.get(
    "/borrows",
    AdminAuth(),
    asyncHandler(borrowController.findAllBorrows.bind(borrowController)),
  );
  router.put(
    "/borrow/:id",
    validator(BorrowValidationSchema.updateBorrowSchema),
    asyncHandler(borrowController.updateBorrow.bind(borrowController)),
  );
  router.delete(
    "/borrow/:id",
    asyncHandler(borrowController.deleteBorrow.bind(borrowController)),
  );
  router.put(
    "/borrow/confirmation-borrow",
    AdminAuth(),
    validator(BorrowValidationSchema.approveDeclineBorrowSchema),
    asyncHandler(
      borrowController.approveOrDeclineBorrow.bind(borrowController),
    ),
  );

  // Return Routes
  router.get(
    "/returns",
    AdminAuth(),
    asyncHandler(returnController.findAllReturns.bind(returnController)),
  );
  router.put(
    "/return/:id",
    AdminAuth(),
    asyncHandler(returnController.updateReturn.bind(returnController)),
  );
  router.delete(
    "/return/:id",
    AdminAuth(),
    asyncHandler(returnController.deleteReturn.bind(returnController)),
  );

  return router;
};

export default createAdminRoute();
