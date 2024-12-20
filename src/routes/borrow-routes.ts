import express, { Request, Response, Router } from "express";
import BorrowController from "../controller/borrow-controller";
import { Auth, validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/borrow-validator-schema";
import { container } from "tsyringe";

const createBorrowRoute = (router: Router = express.Router()): Router => {
  // Inject the BorrowController dependency using tsyringe DI container
  const borrowController = container.resolve(BorrowController);

  // Create Borrow route
  router.post(
    "/",
    Auth(),
    validator(ValidationSchema.createBorrowSchema),
    (req: Request, res: Response) => borrowController.createBorrow(req, res)
  );

  // Fetch a single Borrow by ID
  router.get("/:id", (req: Request, res: Response) => borrowController.getBorrowById(req, res));

  return router;
};

export default createBorrowRoute();
