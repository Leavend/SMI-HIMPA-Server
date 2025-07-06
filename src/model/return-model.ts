/**
 * Return Sequelize model
 * Represents the Returns table in the database
 */
import { DataTypes } from "sequelize";
import Db from "../database";
import { IReturnModel } from "../interface/return-interface";
import { v7 as uuidv7 } from "uuid";

const ReturnModel = Db.define<IReturnModel>(
  "ReturnModel",
  {
    returnId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv7(),
      allowNull: false,
    },
    borrowId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Borrows",
        key: "borrow_id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    dateBorrow: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dateReturn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lateDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "Returns",
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

export default ReturnModel;
