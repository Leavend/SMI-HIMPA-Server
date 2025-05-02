import { Model } from "sequelize";
import BorrowModel from "./borrow-model";
import BorrowDetailModel from "./borrowDetail-model";
import UserModel from "./user-model";
import ReturnModel from "./return-model";
import InventoryModel from "./inventory-model";

// Pastikan semua model sudah diinisialisasi sebelum membuat asosiasi
function setupAssociations() {
  // Relasi: User hasMany Borrow
  UserModel.hasMany(BorrowModel, {
    foreignKey: "user_id",
    as: "borrows",
    onDelete: "CASCADE"
  });

  // Relasi: Borrow belongsTo User
  BorrowModel.belongsTo(UserModel, {
    foreignKey: "user_id",
    as: "user"
  });

  // Relasi: Borrow hasMany BorrowDetail
  BorrowModel.hasMany(BorrowDetailModel, {
    foreignKey: "borrow_id",
    as: "borrowDetails",
    onDelete: "CASCADE"
  });

  // Relasi: BorrowDetail belongsTo Borrow
  BorrowDetailModel.belongsTo(BorrowModel, {
    foreignKey: "borrow_id",
    as: "borrow"
  });

  // Relasi: BorrowDetail belongsTo Inventory
  BorrowDetailModel.belongsTo(InventoryModel, {
    foreignKey: "inventory_id",
    as: "inventory"
  });

  // Relasi: Inventory hasMany BorrowDetail
  InventoryModel.hasMany(BorrowDetailModel, {
    foreignKey: "inventory_id",
    as: "borrowDetails"
  });

  // Relasi: Borrow hasMany Return
  BorrowModel.hasMany(ReturnModel, {
    foreignKey: "borrow_id",
    as: "returns",
    onDelete: "CASCADE"
  });

  // Relasi: Return belongsTo Borrow
  ReturnModel.belongsTo(BorrowModel, {
    foreignKey: "borrow_id",
    as: "borrow"
  });
}

export default setupAssociations;