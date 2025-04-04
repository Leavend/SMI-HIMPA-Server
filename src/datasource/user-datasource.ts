import { Op } from "sequelize";
import {
  IFindUserQuery,
  IUser,
  IUserCreationBody,
  IUserDataSource,
} from "../interface/user-interface";
import UserModel from "../model/user-model";

class UserDataSource implements IUserDataSource {
  async create(record: IUserCreationBody): Promise<IUser> {
    return await UserModel.create(record);
  }

  async fetchOne(query: IFindUserQuery): Promise<IUser | null> {
    return await UserModel.findOne(query);
  }

  async fetchAll(query: IFindUserQuery): Promise<IUser[] | null> {
    return await UserModel.findAll(query);
  }

  async updateOne(
    searchBy: IFindUserQuery,
    data: Partial<IUser>,
  ): Promise<void> {
    await UserModel.update(data, searchBy);
  }
}

export default UserDataSource;
