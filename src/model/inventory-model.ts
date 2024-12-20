import { DataTypes } from "sequelize";
import Db from "../database";
import { IInventoryModel } from "../interface/inventory-interface";
import { v7 as uuidv7 } from "uuid";

const InventoryModel = Db.define<IInventoryModel>(
  "InventoryModel",
  {
    inventoryId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv7(),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
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
    tableName: "Inventories",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

export default InventoryModel;
