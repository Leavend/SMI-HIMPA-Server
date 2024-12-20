import { DataTypes, Sequelize } from "sequelize";
import Db from "../database";
import { IBorrowModel } from "../interface/borrow-interface";
import { v7 as uuidv7 } from "uuid";

const BorrowModel = Db.define<IBorrowModel>(
  "BorrowModel",
  {
    borrowId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv7(),
      allowNull: false,
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
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
    },
    adminId: {
      type: DataTypes.UUID,
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
    tableName: "Borrows",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

export default BorrowModel;
