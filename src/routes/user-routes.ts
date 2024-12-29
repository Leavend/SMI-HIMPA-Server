import express, { Request, Response } from "express";
import UserController from "../controller/user-controller";
import { validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/user-validator-schema";
import { container } from "tsyringe";

const router = express.Router();

const userController = container.resolve(UserController);

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((err) =>
    res.status(500).send(err.message),
  );
};

const createUserRoute = () => {
  router.post(
    "/register",
    validator(ValidationSchema.registerSchema),
    asyncHandler(userController.register.bind(userController)),
  );

  router.post(
    "/login",
    validator(ValidationSchema.loginSchema),
    asyncHandler(userController.login.bind(userController)),
  );

  router.post(
    "/forgot-password",
    validator(ValidationSchema.forgotPasswordSchema),
    asyncHandler(userController.forgotPassword.bind(userController)),
  );

  router.post(
    "/reset-password",
    validator(ValidationSchema.resetPasswordSchema),
    asyncHandler(userController.resetPassword.bind(userController)),
  );

  return router;
};

export default createUserRoute();
