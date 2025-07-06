/**
 * Middleware functions for authentication and validation
 */
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

/**
 * Validation middleware using Yup schema
 * @param schema - Yup validation schema
 * @returns Express middleware function
 */
export const validator = (schema: Schema<any>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Validation failed";
      Utility.handleError(res, errorMessage, ResponseCode.BAD_REQUEST);
    }
  };
};

/**
 * Authenticate JWT token and return user
 * @param req - Express request object
 * @param res - Express response object
 * @returns User object or null
 * @throws Error if authentication fails
 */
const authenticateToken = async (
  req: Request,
  res: Response,
): Promise<IUser | null> => {
  let token: string = req.headers.authorization ?? "";

  if (Utility.isEmpty(token)) {
    throw new Error("Authorization header is required");
  }

  token = token.split(" ")[1];

  if (!token) {
    throw new Error("Invalid token format");
  }

  const decode = jwt.verify(token, process.env.JWT_KEY as string) as IUser;

  if (!decode || !decode.userId) {
    throw new Error("Invalid token");
  }

  const user = await userService.getUserByField({ userId: decode.userId });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Authentication middleware for all users
 * @returns Express middleware function
 */
export const Auth = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await authenticateToken(req, res);
      if (user) {
        req.body.user = user;
        next();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      Utility.handleError(res, errorMessage, ResponseCode.BAD_REQUEST);
    }
  };
};

/**
 * Authentication middleware for admin users only
 * @returns Express middleware function
 */
export const AdminAuth = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await authenticateToken(req, res);

      if (user && user.role === UserRoles.ADMIN) {
        req.body.user = user;
        next();
      } else {
        throw new Error("Admin access required");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      Utility.handleError(res, errorMessage, ResponseCode.BAD_REQUEST);
    }
  };
};
