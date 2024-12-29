import express, { Request, Response } from "express";
import BorrowController from "../controller/borrow-controller";
import { Auth, validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/borrow-validator-schema";
import { container } from "tsyringe";

const router = express.Router();
const borrowController = container.resolve(BorrowController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createBorrowRoute = () => {
  router.post(
    "/",
    Auth(),
    validator(ValidationSchema.createBorrowSchema),
    asyncHandler(borrowController.createBorrow.bind(borrowController)),
  );

  router.get(
    "/borrows/:id",
    Auth(),
    asyncHandler(borrowController.getBorrowsByUser.bind(borrowController)),
  );

  return router;
};

export default createBorrowRoute();
