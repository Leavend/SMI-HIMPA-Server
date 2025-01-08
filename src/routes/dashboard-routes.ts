import express, { Request, Response } from "express";
import DashboardController from "../controller/dashboard-controller";
import { Auth, validator } from "../middlewares/index.middleware";
import { container } from "tsyringe";

const router = express.Router();
const dashboardController = container.resolve(DashboardController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createDashboardRoute = () => {
  router.get(
    "/dashboard",
    Auth(),
    asyncHandler(
      dashboardController.getDashboardMetrics.bind(dashboardController),
    ),
  );

  return router;
};

export default createDashboardRoute();
