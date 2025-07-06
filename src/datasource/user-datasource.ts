/**
 * User Data Source
 * Handles user data operations with the database
 */
import { autoInjectable } from "tsyringe";
import { Op } from "sequelize";
import {
  IFindUserQuery,
  IUser,
  IUserCreationBody,
  IUserDataSource,
} from "../interface/user-interface";
import UserModel from "../model/user-model";

@autoInjectable()
class UserDataSource implements IUserDataSource {
  /**
   * Create a new user record
   */
  async create(record: IUserCreationBody): Promise<IUser> {
    return UserModel.create(record);
  }

  /**
   * Fetch a single user record based on search criteria
   */
  async fetchOne(query: IFindUserQuery): Promise<IUser | null> {
    return UserModel.findOne(query);
  }

  /**
   * Fetch all user records based on search criteria
   */
  async fetchAll(query: IFindUserQuery): Promise<IUser[] | null> {
    return UserModel.findAll(query);
  }

  /**
   * Update a single user record based on search criteria
   */
  async updateOne(
    searchBy: IFindUserQuery,
    data: Partial<IUser>,
  ): Promise<void> {
    await UserModel.update(data, searchBy);
  }

  /**
   * Delete a single user record based on search criteria
   */
  async deleteOne(query: IFindUserQuery): Promise<void> {
    await UserModel.destroy(query);
  }
}

export default UserDataSource;
