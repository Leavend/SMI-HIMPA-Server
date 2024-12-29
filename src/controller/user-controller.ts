import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import moment from "moment";
import { autoInjectable } from "tsyringe";

import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import Permissions from "../permission/index";
import { UserRoles } from "../interface/enum/user-enum";

import UserService from "../service/user-service";

import TokenService from "../service/token-service";
import { IToken } from "../interface/token-interface";

import EmailService from "../service/email-service";

import WhatsAppService from "../service/whatsapp-service";

@autoInjectable()
class UserController {
  private userService: UserService;
  private tokenService: TokenService;

  constructor(_userService: UserService, _tokenService: TokenService) {
    this.userService = _userService;
    this.tokenService = _tokenService;
  }

  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, username, password, number } = req.body;

      // Format phone number
      let formattedNumber;
      try {
        formattedNumber = Utility.formatPhoneNumberToWhatsApp(number);
      } catch (err) {
        return Utility.handleError(
          res,
          "Invalid phone number format. Please provide a valid number.",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Validate uniqueness of email and number separately
      const existingEmail = await this.userService.getUserByField({ email });
      const existingNumber = await this.userService.getUserByField({
        number: formattedNumber,
      });

      const existingUser = existingEmail || existingNumber;

      if (existingUser) {
        const errorField = existingUser.email === email ? "Email" : "Number";
        return Utility.handleError(
          res,
          `${errorField} already exists`,
          ResponseCode.ALREADY_EXIST,
        );
      }

      const existingUsername = await this.userService.getUserByField({
        username,
      });
      if (existingUsername) {
        return Utility.handleError(
          res,
          `Username already exists`,
          ResponseCode.ALREADY_EXIST,
        );
      }

      // Create user object
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        email,
        username,
        password: hashedPassword,
        role: UserRoles.BORROW,
        number: formattedNumber,
      };

      const user = await this.userService.createUser(newUser);
      user.password = ""; // Remove sensitive data

      // Send WhatsApp message
      try {
        const subject = "Account Registration";
        const message = `📢 Your account has been successfully created!`;
        await WhatsAppService.sendMessage(
          user,
          formattedNumber,
          subject,
          message,
        );
      } catch (err) {
        console.error("Failed to send WhatsApp message.", err);
      }

      Utility.handleSuccess(
        res,
        "User registered successfully",
        { user },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      Utility.handleError(
        res,
        "An error occurred during registration.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // User login
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      // Fetch user by username
      const user = await this.userService.getUserByField({ username });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return Utility.handleError(
          res,
          "Invalid login details",
          ResponseCode.ALREADY_EXIST,
        );
      }

      // Generate JWT token
      const token = JWT.sign(
        { userId: user.userId, email: user.email, role: user.role },
        process.env.JWT_KEY as string,
        { expiresIn: "7d" },
      );

      user.password = ""; // Remove sensitive data

      Utility.handleSuccess(
        res,
        "Login successful",
        { user, token },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Login error:", error);
      Utility.handleError(
        res,
        "An error occurred during login.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await this.userService.getUserByField({ email });
      if (!user) {
        return Utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.NOT_FOUND,
        );
      }

      // Generate token and send email
      const token = (await this.tokenService.createForgotPasswordToken(
        email,
      )) as IToken;
      await EmailService.sendForgotPasswordMail(user, email, token.code);

      Utility.handleSuccess(
        res,
        "Password reset code has been sent to your email",
        {},
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      Utility.handleError(
        res,
        "An error occurred during password recovery.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, password } = req.body;

      const isValidToken = await this.tokenService.getTokenByField({
        key: email,
        code,
        type: this.tokenService.TokenTypes.FORGOT_PASSWORD,
        status: this.tokenService.TokenStatus.NOTUSED,
      });

      if (!isValidToken || moment(isValidToken.expires).isBefore(moment())) {
        return Utility.handleError(
          res,
          "Token has expired",
          ResponseCode.NOT_FOUND,
        );
      }

      const user = await this.userService.getUserByField({ email });
      if (!user) {
        return Utility.handleError(
          res,
          "Invalid User Record",
          ResponseCode.NOT_FOUND,
        );
      }

      if (bcrypt.compareSync(password, user.password)) {
        return Utility.handleError(
          res,
          "Try another password",
          ResponseCode.BAD_REQUEST,
        );
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      await this.userService.updateRecord(
        { userId: user.userId },
        { password: hashedPassword },
      );
      await this.tokenService.updateRecord(
        { id: isValidToken.id },
        { status: this.tokenService.TokenStatus.USED },
      );

      return Utility.handleSuccess(
        res,
        "Password reset successful",
        {},
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "An error occurred during password reset.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Update user role
  async updateRole(req: Request, res: Response) {
    try {
      const { userId, newRole } = req.body;
      const admin = req.body.user;

      // Validate permission
      if (!Permissions.can(admin.role).updateAny("users").granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }

      // Validate role
      if (!Object.values(UserRoles).includes(newRole)) {
        return Utility.handleError(
          res,
          "Invalid role specified",
          ResponseCode.BAD_REQUEST,
        );
      }

      // Validate User
      const user = await this.userService.getUserByField({ userId });
      if (!user) {
        return Utility.handleError(
          res,
          "User not found",
          ResponseCode.NOT_FOUND,
        );
      }

      // Update role
      await this.userService.updateRecord({ userId }, { role: newRole });
      Utility.handleSuccess(
        res,
        "User role updated successfully",
        { userId, newRole },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Role update error:", error);
      Utility.handleError(
        res,
        "An error occurred during role update.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Get All User By Admin
  async getAllUsersByAdmin(req: Request, res: Response) {
    try {
      const admin = req.body.user;
      const permission = Permissions.can(admin.role).readAny("users");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }

      const users = await this.userService.getAllUsers();
      if (!users) {
        return Utility.handleError(
          res,
          "No users found",
          ResponseCode.NOT_FOUND,
        );
      }
      const sanitizedUsers = users.map((user) => {
        user.password = "";
        return user;
      });

      return Utility.handleSuccess(
        res,
        "Users fetched successfully",
        { users: sanitizedUsers },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return Utility.handleError(
        res,
        "An error occurred while fetching users.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Get Single User By Admin
  async getSingleUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const admin = req.body.user;
      const permission = Permissions.can(admin.role).readAny("users");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }
      const user = await this.userService.getUserByField({
        userId: Utility.escapeHtml(id),
      });
      if (!user) {
        return Utility.handleError(
          res,
          "User does not exist",
          ResponseCode.NOT_FOUND,
        );
      }
      user.password = "";
      return Utility.handleSuccess(
        res,
        "User fetched successfully",
        { user },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "An error occurred while fetching the user.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Get User in Role Admin
  async getUserRoleAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const admin = req.body.user;
      const permission = Permissions.can(admin.role).readAny("accounts");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.FORBIDDEN,
        );
      }
      const userAdmin = await this.userService.getUserByField({
        userId: Utility.escapeHtml(id),
      });
      if (!userAdmin) {
        return Utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.NOT_FOUND,
        );
      }
      userAdmin.password = ""; // Remove sensitive data
      return Utility.handleSuccess(
        res,
        "Account fetched successfully",
        { userAdmin },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "An error occurred while fetching the account.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }
}

export default UserController;
