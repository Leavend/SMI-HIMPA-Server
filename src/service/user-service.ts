import { autoInjectable } from "tsyringe";
import {
  IFindUserQuery,
  IUser,
  IUserCreationBody,
} from "../interface/user-interface";
import UserDataSource from "../datasource/user-datasource";
import BorrowDataSource from "../datasource/borrow-datasource";

/**
 * Service class for handling user-related operations
 */
@autoInjectable()
class UserService {
  constructor(
    private userDataSource: UserDataSource,
    private borrowDataSource: BorrowDataSource
  ) {}

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
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat memperbarui catatan pengguna: ${errorMessage}`);
    }
  }

  /**
   * Delete user by search criteria
   * @param searchBy - Criteria to find user to delete
   * @param cascade - Whether to delete related borrow records (default: false)
   * @returns Promise that resolves when deletion is complete
   */
  async deleteUser(searchBy: Partial<IUser>, cascade: boolean = false): Promise<void> {
    try {
      // Check if there are related borrow records
      const relatedBorrows = await this.borrowDataSource.fetchAll({
        where: { userId: searchBy.userId },
        raw: true,
        returning: false,
      });

      if (relatedBorrows && relatedBorrows.length > 0) {
        if (!cascade) {
          throw new Error(
            `Cannot delete user because they have ${relatedBorrows.length} related borrow record(s). ` +
            `Use cascade=true to delete related records as well.`
          );
        }

        // If cascade is true, delete related borrow records first
        for (const borrow of relatedBorrows) {
          await this.borrowDataSource.deleteOne({
            where: { borrowId: borrow.borrowId },
            returning: false,
          });
        }
      }

      const query: IFindUserQuery = {
        where: { ...searchBy },
        returning: false,
      };
      await this.userDataSource.deleteOne(query);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      throw new Error(`Kesalahan saat menghapus catatan pengguna: ${errorMessage}`);
    }
  }
}

export default UserService;
