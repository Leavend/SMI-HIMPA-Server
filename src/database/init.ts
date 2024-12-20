import UserModel from "../model/user-model";
import BorrowModel from "../model/borrow-model";
import InventoryModel from "../model/inventory-model";
import TokenModel from "../model/token-model";
import BorrowDetailModel from "../model/borrowDetail-model";
import ReturnModel from "../model/return-model";
import Db from "./index";

const DbInitialize = async () => {
  try {
    await Db.authenticate();
    await UserModel.sync({ alter: false });
    await BorrowModel.sync({ alter: false });
    await InventoryModel.sync({ alter: false });
    await TokenModel.sync({ alter: false });
    await BorrowDetailModel.sync({ alter: false });
    await ReturnModel.sync({ alter: false });
    console.log(
      "Connection to the database has been established successfully.",
    );
  } catch (e) {
    console.error("Error while connecting to the database", e);
  }
};

export default DbInitialize;
