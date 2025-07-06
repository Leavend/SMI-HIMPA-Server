/**
 * Sequelize model associations
 * Defines relationships between database models
 */
import UserModel from "./user-model";
import BorrowModel from "./borrow-model";
import ReturnModel from "./return-model";
import BorrowDetailModel from "./borrowDetail-model";
import InventoryModel from "./inventory-model";

/**
 * User - Borrow relationship
 * One user can have many borrows
 */
UserModel.hasMany(BorrowModel, { foreignKey: "userId", as: "borrows" });
BorrowModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

/**
 * Borrow - Return relationship
 * One borrow can have many returns
 */
BorrowModel.hasMany(ReturnModel, { as: "returns", foreignKey: "borrowId" });
ReturnModel.belongsTo(BorrowModel, { as: "borrow", foreignKey: "borrowId" });

/**
 * Borrow - BorrowDetail relationship
 * One borrow can have many borrow details
 */
BorrowModel.hasMany(BorrowDetailModel, {
  foreignKey: "borrowId",
  as: "borrowDetails",
});
BorrowDetailModel.belongsTo(BorrowModel, {
  foreignKey: "borrowId",
  as: "borrow",
});

/**
 * BorrowDetail - Inventory relationship
 * One inventory can have many borrow details
 */
BorrowDetailModel.belongsTo(InventoryModel, {
  foreignKey: "inventoryId",
  as: "inventory",
});
InventoryModel.hasMany(BorrowDetailModel, {
  foreignKey: "inventoryId",
  as: "borrowDetails",
});
