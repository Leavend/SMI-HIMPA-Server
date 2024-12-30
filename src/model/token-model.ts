import Db from "../database";
import { ITokenModel } from "../interface/token-interface";
import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";

const TokenModel = Db.define<ITokenModel>(
  "TokenModel",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
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
    timestamps: true,
    tableName: "Tokens",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
);

export default TokenModel;
