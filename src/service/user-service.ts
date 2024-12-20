import { autoInjectable } from "tsyringe";
import {
  IFindUserQuery,
  IUser,
  IUserCreationBody,
} from "../interface/user-interface";
import UserDataSource from "../datasource/user-datasource";

@autoInjectable()
class UserService {
  constructor(private userDataSource: UserDataSource) {}

  async getUserByField(record: Partial<IUser>): Promise<IUser | null> {
    try {
      const query = { where: { ...record }, raw: true } as IFindUserQuery;
      return await this.userDataSource.fetchOne(query);
    } catch (error) {
      console.error("Error fetching user by field:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<IUser[] | null> {
    try {
      const query = {
        where: {},
        order: [["createdAt", "DESC"]],
        raw: true,
      } as IFindUserQuery;
      return await this.userDataSource.fetchAll(query);
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  async createUser(record: IUserCreationBody): Promise<IUser> {
    try {
      return await this.userDataSource.create(record);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

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
