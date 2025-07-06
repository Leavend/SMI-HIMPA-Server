import { autoInjectable } from "tsyringe";
import {
  IFindUserQuery,
  IUser,
  IUserCreationBody,
} from "../interface/user-interface";
import UserDataSource from "../datasource/user-datasource";

/**
 * Service class for handling user-related operations
 */
@autoInjectable()
class UserService {
  constructor(private userDataSource: UserDataSource) {}

  /**
   * Get user by field criteria
   * @param record - Partial user object to search by
   * @returns Promise resolving to user or null
   */
  async getUserByField(record: Partial<IUser>): Promise<IUser | null> {
    try {
      const query = {
        where: { ...record },
        raw: true,
        returning: true,
      } as IFindUserQuery;
      return await this.userDataSource.fetchOne(query);
    } catch (error) {
      console.error("Error fetching user by field:", error);
      throw error;
    }
  }

  /**
   * Get all users ordered by creation date
   * @returns Promise resolving to array of users or null
   */
  async getAllUsers(): Promise<IUser[] | null> {
    try {
      const query = {
        where: {},
        order: [["createdAt", "DESC"]],
        raw: true,
        returning: true,
      } as IFindUserQuery;
      return await this.userDataSource.fetchAll(query);
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param record - User creation data
   * @returns Promise resolving to created user
   */
  async createUser(record: IUserCreationBody): Promise<IUser> {
    try {
      return await this.userDataSource.create(record);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user record by search criteria
   * @param searchBy - Criteria to find user to update
   * @param record - Data to update
   * @returns Promise that resolves when update is complete
   */
  async updateRecord(
    searchBy: Partial<IUser>,
    record: Partial<IUser>,
  ): Promise<void> {
    try {
      const query = { where: { ...searchBy } } as IFindUserQuery;
      await this.userDataSource.updateOne(query, record);
    } catch (error) {
      console.error("Error updating user record:", error);
      throw error;
    }
  }
}

export default UserService;
