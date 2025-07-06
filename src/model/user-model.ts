/**
 * User Sequelize model
 * Represents the Users table in the database
 */
import { DataTypes } from "sequelize";
import Db from "../database";
import { IUserModel } from "../interface/user-interface";
import { v7 as uuidv7 } from "uuid";

const UserModel = Db.define<IUserModel>(
  "UserModel",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv7(),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "Users",
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

export default UserModel;
