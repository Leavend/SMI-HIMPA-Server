import express, { Request, Response } from "express";
import UserController from "../controller/user-controller";
import { validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/user-validator-schema";
import { container } from "tsyringe";

const router = express.Router();

const userController = container.resolve(UserController);

const handleRequest = (method: keyof UserController) => {
  return (req: Request, res: Response) => userController[method](req, res);
};

const createUserRoute = () => {
  router.post(
    "/register",
    validator(ValidationSchema.registerSchema),
    handleRequest("register"),
  );
  router.post(
    "/login",
    validator(ValidationSchema.loginSchema),
    handleRequest("login"),
  );
  router.post(
    "/forgot-password",
    validator(ValidationSchema.forgotPasswordSchema),
    handleRequest("forgotPassword"),
  );
  router.post(
    "/reset-password",
    validator(ValidationSchema.resetPasswordSchema),
    handleRequest("resetPassword"),
  );

  return router;
};

export default createUserRoute();
