// associations.ts
import UserModel from "./user-model";
import BorrowModel from "./borrow-model";
import ReturnModel from "./return-model";
import BorrowDetailModel from "./borrowDetail-model";
import InventoryModel from "./inventory-model";

// Relasi antara User dan Borrow
UserModel.hasMany(BorrowModel, { foreignKey: 'userId', as: 'borrows' });
BorrowModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

// Relasi antara Borrow dan Return
BorrowModel.hasMany(ReturnModel, { as: 'returns', foreignKey: 'borrowId' });
ReturnModel.belongsTo(BorrowModel, { as: 'borrow', foreignKey: 'borrowId' });


// Relasi antara Borrow dan BorrowDetail
BorrowModel.hasMany(BorrowDetailModel, { foreignKey: 'borrowId', as: 'borrowDetails' });
BorrowDetailModel.belongsTo(BorrowModel, { foreignKey: 'borrowId', as: 'borrow' });

// Relasi antara BorrowDetail dan Inventory
BorrowDetailModel.belongsTo(InventoryModel, { foreignKey: 'inventoryId', as: 'inventory' });
InventoryModel.hasMany(BorrowDetailModel, { foreignKey: 'inventoryId', as: 'borrowDetails' });
