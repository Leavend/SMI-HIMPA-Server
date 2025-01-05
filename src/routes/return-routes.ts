import express, { Request, Response, Router } from "express";
import ReturnController from "../controller/return-controller";
import { Auth } from "../middlewares/index.middleware";
import { container } from "tsyringe";

// Inject the ReturnController dependency using tsyringe DI container
const returnController = container.resolve(ReturnController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createReturnRoute = (): Router => {
  const router = express.Router();

  // Fetch all returns by User ID
  router.get(
    "/returns/:id",
    Auth(),
    asyncHandler(returnController.findReturnsByUser.bind(returnController)),
  );

  return router;
};

export default createReturnRoute();
