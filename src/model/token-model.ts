/**
 * Token Sequelize model
 * Represents the Tokens table in the database
 */
import { DataTypes } from "sequelize";
import Db from "../database";
import { ITokenModel } from "../interface/token-interface";
import { v7 as uuidv7 } from "uuid";

const TokenModel = Db.define<ITokenModel>(
  "TokenModel",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv7(),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NOTUSED",
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
    tableName: "Tokens",
    timestamps: true,
    underscored: false,
    paranoid: false,
  },
);

export default TokenModel;
