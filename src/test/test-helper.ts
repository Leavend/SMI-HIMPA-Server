import jwt from "jsonwebtoken";
import { IUser } from "../interface/user-interface";
import { UserRoles } from "../interface/enum/user-enum";

/**
 * Test helper utilities
 */
export class TestHelper {
  /**
   * Generate a mock admin token for testing
   */
  static generateMockAdminToken(): string {
    const mockAdminUser: IUser = {
      userId: "test-admin-id",
      username: "testadmin",
      email: "admin@test.com",
      number: "1234567890",
      password: "hashedpassword",
      role: UserRoles.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return jwt.sign(mockAdminUser, process.env.JWT_KEY || "test-secret-key");
  }

  /**
   * Generate a mock user token for testing
   */
  static generateMockUserToken(): string {
    const mockUser: IUser = {
      userId: "test-user-id",
      username: "testuser",
      email: "user@test.com",
      number: "1234567890",
      password: "hashedpassword",
      role: UserRoles.BORROW,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return jwt.sign(mockUser, process.env.JWT_KEY || "test-secret-key");
  }

  /**
   * Get admin authorization headers
   */
  static getAdminHeaders(): { Authorization: string } {
    return {
      Authorization: `Bearer ${this.generateMockAdminToken()}`,
    };
  }

  /**
   * Get user authorization headers
   */
  static getUserHeaders(): { Authorization: string } {
    return {
      Authorization: `Bearer ${this.generateMockUserToken()}`,
    };
  }
}
