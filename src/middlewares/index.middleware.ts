import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Schema } from "yup";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import UserService from "../service/user-service";
import { IUser } from "../interface/user-interface";
import { container } from "tsyringe";
import { UserRoles } from "../interface/enum/user-enum";

const userService = container.resolve(UserService);

export const validator = (schema: Schema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error: any) {
      return Utility.handleError(
        res,
        error.errors[0],
        ResponseCode.BAD_REQUEST,
      );
    }
  };
};

const authenticateToken = async (
  req: Request,
  res: Response,
): Promise<IUser | null> => {
  let token: string = req.headers.authorization ?? "";
  if (Utility.isEmpty(token)) {
    throw new TypeError("Authorization failed");
  }
  token = token.split(" ")[1];
  const decode = jwt.verify(token, process.env.JWT_KEY as string) as IUser;
  if (decode && decode.userId) {
    const user = await userService.getUserByField({ userId: decode.userId });
    if (!user) {
      throw new TypeError("Authorization failed");
    }
    return user;
  }
  return null;
};

export const Auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authenticateToken(req, res);
      if (user) {
        req.body.user = user;
        next();
      }
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.BAD_REQUEST,
      );
    }
  };
};

export const AdminAuth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authenticateToken(req, res);
      if (user && user.role === UserRoles.ADMIN) {
        req.body.user = user;
        next();
      } else {
        throw new TypeError("Authorization failed");
      }
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.BAD_REQUEST,
      );
    }
  };
};
