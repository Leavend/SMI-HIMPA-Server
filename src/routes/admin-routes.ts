import express, { Request, Response } from "express";
import UserController from "../controller/user-controller";
import { AdminAuth, validator } from "../middlewares/index.middleware";
import InventoryValidationSchema from "../validators/inventory-validator-schema";
import BorrowValidationSchema from "../validators/borrow-validator-schema";
import { container } from "tsyringe";
import BorrowController from "../controller/borrow-controller";
import InventoryController from "../controller/inventory-controller";

const router = express.Router();
const userController = container.resolve(UserController);
const borrowController = container.resolve(BorrowController);
const inventoryController = container.resolve(InventoryController);

const createAdminRoute = () => {
  // User Routes
  router.get("/users", AdminAuth(), async (req: Request, res: Response) => {
    await userController.getAllUsersByAdmin(req, res);
  });

  router.get("/user/:id", AdminAuth(), async (req: Request, res: Response) => {
    await userController.getSingleUserById(req, res);
  });

  router.get("/admin/:id", AdminAuth(), async (req: Request, res: Response) => {
    await userController.getUserRoleAdmin(req, res);
  });

  // Inventory Routes
  router.post(
    "/inventory",
    AdminAuth(),
    validator(InventoryValidationSchema.createInventorySchema),
    async (req: Request, res: Response) => {
      await inventoryController.addInventory(req, res);
    },
  );

  router.put(
    "/inventory/:id",
    AdminAuth(),
    validator(InventoryValidationSchema.updateInventorySchema),
    async (req: Request, res: Response) => {
      await inventoryController.modifyInventory(req, res);
    },
  );

  router.delete(
    "/inventory/:id",
    AdminAuth(),
    async (req: Request, res: Response) => {
      await inventoryController.removeInventory(req, res);
    },
  );

  // Borrow Routes
  router.get("/borrows", AdminAuth(), async (req: Request, res: Response) => {
    await borrowController.findAllBorrows(req, res);
  });

  router.get("/search", async (req: Request, res: Response) => {
    await borrowController.getBorrow(req, res);
  });

  router.put(
    "/:id",
    validator(BorrowValidationSchema.updateBorrowSchema),
    async (req: Request, res: Response) => {
      await borrowController.updateBorrow(req, res);
    },
  );

  router.delete("/:id", async (req: Request, res: Response) => {
    await borrowController.deleteBorrow(req, res);
  });

  router.post(
    "/borrow/approve-decline-borrow",
    AdminAuth(),
    validator(BorrowValidationSchema.approveDeclineBorrowSchema),
    async (req: Request, res: Response) => {
      await borrowController.approveOrDeclineBorrow(req, res);
    },
  );

  return router;
};

export default createAdminRoute();
