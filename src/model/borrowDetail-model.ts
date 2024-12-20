import { DataTypes } from "sequelize";
import Db from "../database";
import { IBorrowDetailModel } from "../interface/borrowDetail-interface";
import { v7 as uuidv7 } from "uuid";

const BorrowDetailModel = Db.define<IBorrowDetailModel>(
  "BorrowDetailModel",
  {
    borrowDetailId: {
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
    inventoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Inventories",
        key: "inventory_id",
      },
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
    tableName: "BorrowDetails",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

export default BorrowDetailModel;
