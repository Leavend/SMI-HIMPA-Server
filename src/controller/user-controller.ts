/**
 * User Controller
 * Handles user registration, authentication, and management
 */
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import moment from "moment";
import { autoInjectable } from "tsyringe";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interface/enum/code-enum";
import { UserRoles } from "../interface/enum/user-enum";
import UserService from "../service/user-service";
import TokenService from "../service/token-service";
import { IToken } from "../interface/token-interface";
import EmailService from "../service/email-service";
import WhatsAppService from "../service/whatsapp-service";

@autoInjectable()
class UserController {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, username, password, number } = req.body;
      const formattedNumber = Utility.formatPhoneNumberToWhatsApp(number);
      const existingEmail = await this.userService.getUserByField({ email });
      if (existingEmail) {
        return Utility.handleError(
          res,
          "Email sudah terdaftar",
          ResponseCode.ALREADY_EXIST,
        );
      }
      const existingUsername = await this.userService.getUserByField({
        username,
      });
      if (existingUsername) {
        return Utility.handleError(
          res,
          "Username sudah terdaftar",
          ResponseCode.ALREADY_EXIST,
        );
      }
      const existingNumber = await this.userService.getUserByField({
        number: formattedNumber,
      });
      if (existingNumber) {
        return Utility.handleError(
          res,
          "Nomor sudah terdaftar",
          ResponseCode.ALREADY_EXIST,
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        email,
        username,
        password: hashedPassword,
        role: UserRoles.BORROW,
        number: formattedNumber,
      };
      const user = await this.userService.createUser(newUser);
      user.password = "";
      await WhatsAppService.sendMessage(
        user,
        formattedNumber,
        "Akun Registrasi",
        "📢 Akun Anda telah berhasil dibuat!",
      );
      return Utility.handleSuccess(
        res,
        "Registrasi pengguna berhasil",
        { user },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "Terjadi kesalahan saat registrasi.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password } = req.body;
      const user = await this.userService.getUserByField({ username });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return Utility.handleError(
          res,
          "Invalid login details",
          ResponseCode.ALREADY_EXIST,
        );
      }
      const token = JWT.sign(
        { userId: user.userId, email: user.email, role: user.role },
        process.env.JWT_KEY as string,
        { expiresIn: "7d" },
      );
      user.password = "";
      return Utility.handleSuccess(
        res,
        "Login successful",
        { user, token },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "An error occurred during login.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      const user = await this.userService.getUserByField({ email });
      if (!user) {
        return Utility.handleError(
          res,
          "Akun tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }
      const token = (await this.tokenService.createForgotPasswordToken(
        email,
      )) as IToken;
      await EmailService.sendForgotPasswordMail(user, email, token.code);
      return Utility.handleSuccess(
        res,
        "Kode reset password telah dikirim ke email Anda",
        {},
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "Terjadi kesalahan saat pemulihan password.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response): Promise<Response> {
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

  /**
   * Update user role
   */
  async updateRole(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, newRole } = req.body;
      if (!Object.values(UserRoles).includes(newRole)) {
        return Utility.handleError(
          res,
          "Invalid role specified",
          ResponseCode.BAD_REQUEST,
        );
      }
      const user = await this.userService.getUserByField({ userId });
      if (!user) {
        return Utility.handleError(
          res,
          "User not found",
          ResponseCode.NOT_FOUND,
        );
      }

      await this.userService.updateRecord({ userId }, { role: newRole });
      return Utility.handleSuccess(
        res,
        "User role updated successfully",
        { userId, newRole },
        ResponseCode.SUCCESS,
      );
    } catch (error) {
      return Utility.handleError(
        res,
        "An error occurred during role update.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  // Get All User By Admin
  async getAllUsersByAdmin(req: Request, res: Response) {
    try {
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
      Utility.handleError(
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
      Utility.handleError(
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
      const userAdmin = await this.userService.getUserByField({
        userId: Utility.escapeHtml(id),
        role: UserRoles.ADMIN,
      });
      if (!userAdmin) {
        return Utility.handleError(
          res,
          "Account does not Admin exist",
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
      Utility.handleError(
        res,
        "An error occurred while fetching the account.",
        ResponseCode.SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id: userId } = req.params;

      if (!userId) {
        return Utility.handleError(
          res,
          "User ID wajib diisi",
          ResponseCode.BAD_REQUEST,
        );
      }

      const sanitizedUserId = Utility.escapeHtml(userId);
      const userExists = await this.userService.getUserByField({
        userId: sanitizedUserId,
      });

      if (!userExists) {
        return Utility.handleError(
          res,
          "Pengguna tidak ditemukan",
          ResponseCode.NOT_FOUND,
        );
      }

      // Check if cascade parameter is provided
      const cascade = req.query.cascade === "true";

      await this.userService.deleteUser(
        { userId: sanitizedUserId },
        cascade,
      );

      const message = cascade
        ? "Pengguna dan data peminjaman terkait berhasil dihapus"
        : "Pengguna berhasil dihapus";

      return Utility.handleSuccess(res, message, {}, ResponseCode.SUCCESS);
    } catch (error) {
      // Handle foreign key constraint error specifically
      if (
        error instanceof Error &&
        error.message.includes("Tidak dapat menghapus pengguna karena masih memiliki")
      ) {
        return Utility.handleError(
          res,
          error.message,
          ResponseCode.BAD_REQUEST,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      return Utility.handleError(res, errorMessage, ResponseCode.SERVER_ERROR);
    }
  }
}

export default UserController;
